const dns = require('dns').promises;
const net = require('net');

/**
 * Checks if an IPv4 address is within private, loopback, or reserved ranges.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 Current network
  if (a === 0) return true;
  // 10.0.0.0/8 Private network
  if (a === 10) return true;
  // 100.64.0.0/10 Carrier-grade NAT
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 Loopback
  if (a === 127) return true;
  // 169.254.0.0/16 Link-local / Cloud metadata (AWS, GCP, Azure, etc.)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 Private network
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 IETF Protocol Assignments
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.0.2.0/24 TEST-NET-1
  if (a === 192 && b === 0 && c === 2) return true;
  // 192.168.0.0/16 Private network
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 Network benchmark
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 TEST-NET-2
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 TEST-NET-3
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 Multicast
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 Reserved
  if (a >= 240) return true;
  // Broadcast
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address is private, loopback, or reserved.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();
  // Loopback
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
  // IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }
  // Unique local address fc00::/7
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local address fe80::/10
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;

  return false;
}

/**
 * General IP check
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIp(ip) {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // Invalid format treated as unsafe
}

/**
 * Validates a target URL against SSRF attacks and accessibility restrictions.
 * @param {string} inputUrl
 * @returns {Promise<{ valid: boolean, url: string, hostname: string, resolvedIp: string, error?: string }>}
 */
async function validateUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = inputUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return { valid: false, error: 'Invalid URL format. Please include http:// or https://' };
  }

  // Allow only http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Protocol "${parsed.protocol}" is not supported. Use http:// or https://.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, common cloud metadata names
  const blockedHostnames = [
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    'instance-data',
    'metadata.packet.net'
  ];

  if (blockedHostnames.includes(hostname) || hostname.endsWith('.localhost')) {
    return { valid: false, error: `Host "${hostname}" is restricted for security.` };
  }

  // Check if hostname is direct IP literal
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { valid: false, error: `IP address "${hostname}" belongs to a private/reserved network.` };
    }
    return {
      valid: true,
      url: parsed.href,
      hostname,
      resolvedIp: hostname
    };
  }

  // DNS resolution
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    if (!lookupResult || lookupResult.length === 0) {
      return { valid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const entry of lookupResult) {
      if (isPrivateIp(entry.address)) {
        return {
          valid: false,
          error: `Hostname "${hostname}" resolved to restricted IP address "${entry.address}". Access denied.`
        };
      }
    }

    return {
      valid: true,
      url: parsed.href,
      hostname,
      resolvedIp: lookupResult[0].address
    };
  } catch (err) {
    return { valid: false, error: `DNS lookup failed for "${hostname}": ${err.message}` };
  }
}

module.exports = {
  validateUrl,
  isPrivateIp,
  isPrivateIPv4,
  isPrivateIPv6
};
