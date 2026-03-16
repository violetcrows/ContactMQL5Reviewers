#!/bin/bash
# All-in-one: fix mql5.com access. Run whenever you have problems with mql5.
#   ./setup-mql5-dns.sh
# Does: clean old overrides → resolve current IP → set hosts + dnsmasq + resolver → flush DNS.
# Requires: sudo (you will be prompted), Homebrew, dnsmasq (installed if missing).

set -e

HOSTS_FILE="/etc/hosts"
RESOLVER_DIR="/etc/resolver"
RESOLVER_FILE="$RESOLVER_DIR/mql5.com"
DNSMASQ_D="$(brew --prefix 2>/dev/null)/etc/dnsmasq.d"
MQL5_CONF="$DNSMASQ_D/mql5.conf"
FALLBACK_IP="194.164.179.31"

# --- Ensure we have what we need ---
if ! command -v brew &>/dev/null; then
  echo "Error: Homebrew not found. Install from https://brew.sh"
  exit 1
fi
if ! brew list dnsmasq &>/dev/null; then
  echo "dnsmasq not installed. Installing..."
  brew install dnsmasq
fi

echo "=============================================="
echo "  MQL5 DNS/hosts fix — clean, resolve, set"
echo "=============================================="
echo ""

# --- Phase 1: Clean previous mql5 overrides ---
echo "=== 1. Clean previous mql5 overrides ==="
sudo sed -i '' '/[[:space:]]mql5\.com$/d' "$HOSTS_FILE" 2>/dev/null || true
sudo sed -i '' '/[[:space:]]www\.mql5\.com$/d' "$HOSTS_FILE" 2>/dev/null || true
sudo rm -f "$RESOLVER_FILE" 2>/dev/null || true
echo "  Removed mql5 entries from /etc/hosts and resolver (if any)."

echo ""
echo "=== 2. Resolve current mql5.com IP ==="
MQL5_IP=$(dig @8.8.8.8 +short mql5.com 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
if [ -z "$MQL5_IP" ]; then
  MQL5_IP=$(dig @8.8.8.8 +short www.mql5.com 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
fi
if [ -z "$MQL5_IP" ]; then
  echo "  Lookup failed, using fallback IP: $FALLBACK_IP"
  MQL5_IP="$FALLBACK_IP"
else
  echo "  Resolved: mql5.com → $MQL5_IP"
fi

echo ""
echo "=== 3. Set /etc/hosts override ==="
for domain in mql5.com www.mql5.com; do
  echo "$MQL5_IP $domain" | sudo tee -a "$HOSTS_FILE" > /dev/null
  echo "  Added: $MQL5_IP $domain"
done

echo ""
echo "=== 4. Set macOS resolver for mql5.com ==="
sudo mkdir -p "$RESOLVER_DIR"
echo "nameserver 127.0.0.1" | sudo tee "$RESOLVER_FILE" > /dev/null
echo "  Created $RESOLVER_FILE"

echo ""
echo "=== 5. Set dnsmasq override and (re)start service ==="
sudo mkdir -p "$DNSMASQ_D"
sudo tee "$MQL5_CONF" > /dev/null <<EOL
# MQL5 override (setup-mql5-dns.sh)
address=/mql5.com/$MQL5_IP
address=/www.mql5.com/$MQL5_IP
EOL
echo "  Wrote $MQL5_CONF (IP: $MQL5_IP)"
sudo brew services restart dnsmasq 2>/dev/null || sudo brew services start dnsmasq 2>/dev/null || true
echo "  dnsmasq restarted"

echo ""
echo "=== 6. Flush DNS cache ==="
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null || true
echo "  Done"

echo ""
echo "=============================================="
echo "  Summary"
echo "=============================================="
echo "  mql5.com / www.mql5.com  →  $MQL5_IP"
echo "  /etc/hosts + dnsmasq + resolver set; DNS flushed."
echo ""
echo "  Check:    dig +short mql5.com   (should show $MQL5_IP)"
echo "  Browser:  https://www.mql5.com"
echo ""
