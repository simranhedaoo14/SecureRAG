
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

import dns.exception
import dns.resolver


COMMON_TLDS = ("com", "net", "org", "co", "io")
MAX_VARIANTS = 150
DNS_TIMEOUT = 1.5


def normalize_domain(value: str) -> str:
    """Validate and normalize a plain ASCII domain name."""
    domain = value.strip().lower().rstrip(".")

    if (
        not domain
        or len(domain) > 253
        or "://" in domain
        or "/" in domain
        or "@" in domain
        or ":" in domain
        or any(ch.isspace() for ch in domain)
    ):
        raise ValueError("Enter a domain only, such as example.com.")

    try:
        domain = domain.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("Invalid domain name.") from exc

    labels = domain.split(".")
    if len(labels) < 2:
        raise ValueError("Enter a complete domain, such as example.com.")

    label_pattern = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")
    if any(not label_pattern.fullmatch(label) for label in labels):
        raise ValueError("The domain contains an invalid label.")

    if len(labels[-1]) < 2:
        raise ValueError("The top-level domain is invalid.")

    return domain


def generate_variants(domain: str, limit: int = MAX_VARIANTS) -> list[str]:
    """Generate common typosquatting candidates without the original domain."""
    domain = normalize_domain(domain)
    name, tld = domain.rsplit(".", 1)
    candidates = set()

    # Omission, repetition, and adjacent-character transposition.
    for i in range(len(name)):
        candidates.add(name[:i] + name[i + 1:])
        candidates.add(name[:i] + name[i] + name[i:])

    for i in range(len(name) - 1):
        if name[i] != name[i + 1]:
            swapped = list(name)
            swapped[i], swapped[i + 1] = swapped[i + 1], swapped[i]
            candidates.add("".join(swapped))

    # Common keyboard-neighbor substitutions.
    keyboard = {
        "a": "sqwz", "b": "vghn", "c": "xdfv",
        "d": "serfcx", "e": "wsdr", "f": "drtgvc",
        "g": "ftyhbv", "h": "gyujnb", "i": "ujko",
        "j": "huikmn", "k": "jiolm", "l": "kop",
        "m": "njk", "n": "bhjm", "o": "iklp",
        "p": "ol", "q": "wa", "r": "edft",
        "s": "awedxz", "t": "rfgy", "u": "yhji",
        "v": "cfgb", "w": "qase", "x": "zsdc",
        "y": "tghu", "z": "asx",
    }

    for i, char in enumerate(name):
        for replacement in keyboard.get(char, ""):
            candidates.add(name[:i] + replacement + name[i + 1:])

    # Hyphen insertion and duplicated separators are common visual variants.
    for i in range(1, len(name)):
        candidates.add(name[:i] + "-" + name[i:])

    # Alternative TLDs for the same registered-name label.
    for alternative_tld in COMMON_TLDS:
        if alternative_tld != tld:
            candidates.add(f"{name}.{alternative_tld}")

    # Recombine name variants with the original TLD.
    variants = {
        f"{candidate}.{tld}"
        for candidate in candidates
        if candidate and candidate != name
    }

    # Keep the results deterministic and exclude invalid candidates.
    valid = []
    for candidate in sorted(variants):
        try:
            valid.append(normalize_domain(candidate))
        except ValueError:
            continue

    return valid[:max(1, min(limit, MAX_VARIANTS))]


def check_dns(domain: str) -> dict:
    """Check common DNS record types; DNS results are not a malware verdict."""
    resolver = dns.resolver.Resolver()
    resolver.timeout = DNS_TIMEOUT
    resolver.lifetime = DNS_TIMEOUT

    found_records = []
    lookup_errors = []

    for record_type in ("A", "AAAA", "MX", "NS"):
        try:
            answers = resolver.resolve(domain, record_type, raise_on_no_answer=False)
            if answers.rrset:
                found_records.append(record_type)
        except dns.resolver.NXDOMAIN:
            return {
                "domain": domain,
                "registration_status": "no_dns_records_found",
                "dns_records": [],
                "note": "NXDOMAIN was returned. This does not prove registration status.",
            }
        except (dns.resolver.NoAnswer, dns.resolver.NoNameservers,
                dns.exception.Timeout, OSError) as exc:
            lookup_errors.append(f"{record_type}: {type(exc).__name__}")

    if found_records:
        status = "dns_records_found"
        note = "DNS records were found; this is not a maliciousness verdict."
    elif lookup_errors:
        status = "lookup_error"
        note = "DNS checks were inconclusive."
    else:
        status = "no_dns_records_found"
        note = "No queried DNS records were found; registration status is unconfirmed."

    return {
        "domain": domain,
        "registration_status": status,
        "dns_records": found_records,
        "lookup_errors": lookup_errors,
        "note": note,
    }


def scan_domain(domain: str, check_dns_records: bool = True) -> dict:
    """Generate lookalike candidates and optionally check their DNS records."""
    original = normalize_domain(domain)
    variants = generate_variants(original)

    if not check_dns_records:
        return {
            "original_domain": original,
            "total_variants": len(variants),
            "results": [
                {
                    "domain": variant,
                    "registration_status": "not_checked",
                    "dns_records": [],
                    "similarity": "generated_candidate",
                    "risk_score": None,
                    "note": "A generated lookalike is not necessarily malicious.",
                }
                for variant in variants
            ],
        }

    results = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(check_dns, variant): variant for variant in variants}
        for future in as_completed(futures):
            variant = futures[future]
            try:
                result = future.result()
            except Exception as exc:
                result = {
                    "domain": variant,
                    "registration_status": "lookup_error",
                    "dns_records": [],
                    "note": f"DNS check failed: {type(exc).__name__}",
                }
            result["similarity"] = "generated_candidate"
            # No numerical risk score is invented: registration alone is insufficient.
            result["risk_score"] = None
            results.append(result)

    results.sort(key=lambda item: item["domain"])

    return {
        "original_domain": original,
        "total_variants": len(results),
        "results": results,
    }
