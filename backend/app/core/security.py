import ipaddress
import socket
from urllib.parse import urlparse

def is_safe_url(url: str) -> bool:
    """
    Validates URL to protect against SSRF (Server-Side Request Forgery).
    Prevents access to private, loopback, link-local, and reserved IP ranges.
    """
    if not url or not isinstance(url, str):
        return False
        
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        return False
        
    hostname = parsed.hostname
    if not hostname:
        return False
        
    # Check for localhost / loopback names
    if hostname.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "local"):
        return False
        
    try:
        # Resolve IP addresses
        ip_addresses = socket.getaddrinfo(hostname, None)
        for entry in ip_addresses:
            ip_str = entry[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_reserved
                or ip_obj.is_multicast
            ):
                return False
    except (socket.gaierror, ValueError):
        # If DNS resolution fails, reject
        return False
        
    return True
