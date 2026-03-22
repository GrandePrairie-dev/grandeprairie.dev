#!/bin/bash
# Generate hero and page images via Replicate FLUX.1
# Usage: bash scripts/generate-images.sh

REPLICATE_TOKEN="${REPLICATE_API_TOKEN:?Set REPLICATE_API_TOKEN env var}"
MODEL="black-forest-labs/flux-1.1-pro"
OUT_DIR="public/images"

mkdir -p "$OUT_DIR"

generate() {
  local name="$1"
  local prompt="$2"
  local width="${3:-1440}"
  local height="${4:-1024}"
  local steps="${5:-30}"
  local guidance="${6:-3.5}"

  echo "Generating: $name..."

  # Create prediction
  RESPONSE=$(curl -s -X POST "https://api.replicate.com/v1/models/$MODEL/predictions" \
    -H "Authorization: Bearer $REPLICATE_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Prefer: wait" \
    -d "{
      \"input\": {
        \"prompt\": \"$prompt\",
        \"width\": $width,
        \"height\": $height,
        \"num_inference_steps\": $steps,
        \"guidance\": $guidance,
        \"output_format\": \"webp\",
        \"output_quality\": 90,
        \"safety_tolerance\": 2
      }
    }")

  # Extract output URL
  URL=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('output','') or d.get('urls',{}).get('get',''))" 2>/dev/null)

  if [ -z "$URL" ] || [ "$URL" = "" ] || [ "$URL" = "None" ]; then
    # Try getting the prediction ID and polling
    PRED_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
    if [ -n "$PRED_ID" ] && [ "$PRED_ID" != "" ]; then
      echo "  Polling prediction $PRED_ID..."
      for i in $(seq 1 30); do
        sleep 5
        POLL=$(curl -s "https://api.replicate.com/v1/predictions/$PRED_ID" \
          -H "Authorization: Bearer $REPLICATE_TOKEN")
        STATUS=$(echo "$POLL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
        if [ "$STATUS" = "succeeded" ]; then
          URL=$(echo "$POLL" | python3 -c "import sys,json; o=json.load(sys.stdin).get('output',''); print(o if isinstance(o,str) else o[0] if isinstance(o,list) else '')" 2>/dev/null)
          break
        elif [ "$STATUS" = "failed" ]; then
          echo "  FAILED: $name"
          return 1
        fi
        echo "  Status: $STATUS ($i/30)..."
      done
    else
      echo "  ERROR: No prediction ID. Response: $(echo "$RESPONSE" | head -c 200)"
      return 1
    fi
  fi

  if [ -n "$URL" ] && [ "$URL" != "" ] && [ "$URL" != "None" ]; then
    curl -s -L "$URL" -o "$OUT_DIR/$name.webp"
    echo "  Saved: $OUT_DIR/$name.webp ($(wc -c < "$OUT_DIR/$name.webp") bytes)"
  else
    echo "  FAILED to get URL for $name"
  fi
}

# 1. Hero — Aurora Over Peace Region
generate "hero-aurora" \
  "Vast boreal forest landscape in northern Alberta Canada at twilight, towering black spruce trees silhouetted against dramatic aurora borealis in emerald green and teal, wide open prairie sky, subtle oil and gas infrastructure on the horizon, single warm amber light in distance, cinematic wide angle, shot on Phase One, f/2.8, ultra sharp foreground detail, volumetric atmospheric haze, no people, no text, photorealistic, National Geographic quality"

# 2. Golden Hour — Peace Region
generate "hero-golden-hour" \
  "Golden hour over Peace River valley in northwest Alberta, rolling wheat and canola fields in deep amber and gold, boreal forest treeline on horizon, dramatic cloudscape with rays of light breaking through, gravel road disappearing into distance, no people, cinematic composition, shot on Hasselblad, tack sharp, warm rich tones, photorealistic landscape photography"

# 3. Industrial — Greenview Gateway
generate "industrial-dusk" \
  "Aerial perspective of large industrial park in northern Alberta at dusk, modern prefabricated industrial buildings with warm interior lighting, natural gas pipeline infrastructure, boreal forest surrounding the complex, dramatic purple and amber sky, subtle aurora beginning to appear, no people visible, cinematic drone photography, sharp detail, professional architectural photography"

# 4. Night City — GP Downtown Winter
generate "night-downtown" \
  "Wide angle night photography of small northern Canadian city downtown in winter, warm storefront lights reflecting on snow-covered streets, clear night sky with visible stars, steam rising from vents, pickup trucks parked on main street, christmas lights still up, no people, moody and atmospheric, shot on Sony A7 IV, 24mm wide angle, f/1.8, long exposure, photorealistic"

# 5. Community Meetup
generate "community-meetup" \
  "Candid documentary photo of small tech meetup in modern co-working space in northern Canadian city, 8-12 diverse people standing and sitting with laptops and coffee cups, casual conversation, warm interior lighting, exposed brick wall, projector screen in background showing code, authentic community feeling, nobody looking directly at camera, 35mm street photography style, Fujifilm color rendering" \
  1440 960 35 4.0

# 6. Energy-Tech — Montney
generate "energy-tech" \
  "Dramatic aerial photograph of natural gas processing facility in northwest Alberta at golden hour, flare stacks with small controlled flame, pipeline infrastructure stretching across boreal landscape, Montney Formation badlands visible in middle distance, dramatic cloudscape, no people, cinematic drone photography, professional energy sector photography, warm amber and steel tones"

# 7. Brand Abstract — Textures
generate "brand-textures" \
  "Abstract macro photography of boreal forest textures and materials, close up of weathered spruce bark in deep green and brown tones, frost crystals on pine needles, industrial steel cable texture, warm amber lichen on dark granite, layered natural textures, no people, studio macro photography, extreme detail, Boreal Spruce green and Prairie Amber color story" \
  1024 1024 28 3.0

echo ""
echo "Done! Generated images in $OUT_DIR/"
ls -la "$OUT_DIR/"
