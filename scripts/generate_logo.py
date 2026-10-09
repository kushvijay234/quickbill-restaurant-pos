import os
from PIL import Image, ImageDraw, ImageFont

def generate_logo_png():
    W, H = 1024, 1024
    scale = 2
    w, h = W * scale, H * scale

    # Master RGBA canvas
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    
    # 1. Outer Square Box with smooth rounded corners
    pad = 32 * scale
    rad = 180 * scale

    green_top = (22, 163, 74)   # #16a34a Emerald green
    green_mid = (16, 185, 129)  # #10b981
    green_bot = (21, 128, 61)   # #15803d Rich deep green

    # Mask for rounded square box
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([pad, pad, w - pad, h - pad], radius=rad, fill=255)

    # Render smooth vertical gradient on background box
    grad = Image.new('RGBA', (w, h))
    for y in range(h):
        t = y / h
        if t < 0.5:
            factor = t / 0.5
            r = int(green_mid[0] * (1 - factor) + green_top[0] * factor)
            g = int(green_mid[1] * (1 - factor) + green_top[1] * factor)
            b = int(green_mid[2] * (1 - factor) + green_top[2] * factor)
        else:
            factor = (t - 0.5) / 0.5
            r = int(green_top[0] * (1 - factor) + green_bot[0] * factor)
            g = int(green_top[1] * (1 - factor) + green_bot[1] * factor)
            b = int(green_top[2] * (1 - factor) + green_bot[2] * factor)
        ImageDraw.Draw(grad).line([(0, y), (w, y)], fill=(r, g, b, 255))

    img.paste(grad, (0, 0), mask)

    # Subtle inner border/ring for sleek app icon finish
    ring_draw = ImageDraw.Draw(img)
    ring_draw.rounded_rectangle(
        [pad + 3 * scale, pad + 3 * scale, w - pad - 3 * scale, h - pad - 3 * scale],
        radius=rad - 3 * scale,
        outline=(255, 255, 255, 45),
        width=int(4 * scale)
    )

    # 2. Middle Bill / Receipt Design
    bill_w = int(450 * scale)
    bill_h = int(490 * scale)
    bill_x = (w - bill_w) // 2
    bill_y = int(145 * scale)

    # Soft drop shadow underneath the bill
    shadow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle(
        [bill_x, bill_y + int(14 * scale), bill_x + bill_w, bill_y + bill_h + int(14 * scale)],
        radius=int(26 * scale),
        fill=(10, 60, 25, 75)
    )
    img = Image.alpha_composite(img, shadow)

    draw = ImageDraw.Draw(img)

    # Perforated / sawtooth zigzag bottom
    teeth = 8
    tooth_w = bill_w / teeth
    tooth_h = 24 * scale

    bill_points = [
        (bill_x + 28 * scale, bill_y),
        (bill_x + bill_w - 28 * scale, bill_y),
        (bill_x + bill_w, bill_y + 28 * scale),
        (bill_x + bill_w, bill_y + bill_h - tooth_h),
    ]

    for i in range(teeth):
        tx = bill_x + bill_w - i * tooth_w
        bill_points.append((tx - tooth_w / 2, bill_y + bill_h))
        bill_points.append((tx - tooth_w, bill_y + bill_h - tooth_h))

    bill_points.extend([
        (bill_x, bill_y + 28 * scale),
        (bill_x + 28 * scale, bill_y)
    ])

    # Draw pure crisp white receipt body
    draw.polygon(bill_points, fill=(255, 255, 255, 255))

    # Bill paper subtle outline
    draw.line(bill_points, fill=(241, 245, 249, 255), width=int(2 * scale))

    # Bill header - modern pill badge with mini lightning / speed spark
    header_pill_w = int(140 * scale)
    header_pill_h = int(22 * scale)
    pill_x = (w - header_pill_w) // 2
    pill_y = bill_y + int(36 * scale)
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + header_pill_w, pill_y + header_pill_h],
        radius=int(11 * scale),
        fill=(22, 163, 74, 255)
    )

    # 3 punch holes / receipt dots
    for offset in [-64, 0, 64]:
        cx = w // 2 + offset * scale
        cy = bill_y + int(78 * scale)
        draw.ellipse([cx - 4 * scale, cy - 4 * scale, cx + 4 * scale, cy + 4 * scale], fill=(203, 213, 225, 255))

    # Clean divider below header
    draw.line(
        [(bill_x + 36 * scale, bill_y + int(112 * scale)), (bill_x + bill_w - 36 * scale, bill_y + int(112 * scale))],
        fill=(226, 232, 240, 255),
        width=int(3 * scale)
    )

    # Bill Items (Left: Description Bar, Right: Amount Bar)
    items_spec = [
        (148, 220, 90, (148, 163, 184)),   # Item 1
        (192, 180, 80, (203, 213, 225)),   # Item 2
        (236, 240, 100, (203, 213, 225)),  # Item 3
        (280, 160, 75, (226, 232, 240)),   # Item 4
    ]

    for y_rel, w_left, w_right, col in items_spec:
        iy = bill_y + int(y_rel * scale)
        # Left item description bar
        draw.rounded_rectangle(
            [bill_x + int(40 * scale), iy, bill_x + int((40 + w_left) * scale), iy + int(14 * scale)],
            radius=int(7 * scale),
            fill=(*col, 255)
        )
        # Right price bar
        draw.rounded_rectangle(
            [bill_x + bill_w - int((40 + w_right) * scale), iy, bill_x + bill_w - int(40 * scale), iy + int(14 * scale)],
            radius=int(7 * scale),
            fill=(*col, 255)
        )

    # Dashed divider before total
    dash_y = bill_y + int(326 * scale)
    start_x = int(bill_x + 36 * scale)
    end_x = int(bill_x + bill_w - 36 * scale)
    dash_len = int(12 * scale)
    gap_len = int(10 * scale)
    curr_x = start_x
    while curr_x < end_x:
        next_x = min(curr_x + dash_len, end_x)
        draw.line([(curr_x, dash_y), (next_x, dash_y)], fill=(148, 163, 184, 255), width=int(4 * scale))
        curr_x += dash_len + gap_len

    # TOTAL ROW (Green accent bars for instant POS recognition)
    tot_y = bill_y + int(358 * scale)
    draw.rounded_rectangle(
        [bill_x + int(40 * scale), tot_y, bill_x + int(180 * scale), tot_y + int(24 * scale)],
        radius=int(8 * scale),
        fill=(22, 163, 74, 255)
    )
    draw.rounded_rectangle(
        [bill_x + bill_w - int(150 * scale), tot_y, bill_x + bill_w - int(40 * scale), tot_y + int(24 * scale)],
        radius=int(8 * scale),
        fill=(22, 163, 74, 255)
    )

    # Clean barcode lines near bottom of receipt
    barcode_y = bill_y + int(410 * scale)
    barcode_h = int(30 * scale)
    bar_widths = [4, 8, 3, 7, 5, 10, 4, 6, 9, 3, 8, 5, 4, 7, 10, 5, 4, 8, 6, 4]
    bx = bill_x + int(48 * scale)
    for bw in bar_widths:
        w_scaled = int(bw * scale)
        draw.rectangle([bx, barcode_y, bx + w_scaled, barcode_y + barcode_h], fill=(71, 85, 105, 255))
        bx += w_scaled + int(6 * scale)

    # 3. Below the design: write "FASTBILLO" in white color
    font = None
    for font_cand in [
        'C:/Windows/Fonts/segoeuib.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'C:/Windows/Fonts/calibrib.ttf',
    ]:
        if os.path.exists(font_cand):
            try:
                font = ImageFont.truetype(font_cand, int(104 * scale))
                break
            except Exception:
                pass
    if not font:
        font = ImageFont.load_default()

    brand_text = "FASTBILLO"
    bbox = draw.textbbox((0, 0), brand_text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (w - tw) // 2
    ty = int(765 * scale)

    # Shadow for maximum punch and legibility
    draw.text((tx, ty + int(4 * scale)), brand_text, font=font, fill=(15, 80, 38, 200))
    # Crisp white text
    draw.text((tx, ty), brand_text, font=font, fill=(255, 255, 255, 255))

    # Downsample to 1024x1024 with Lanczos for smooth antialiasing
    final_img = img.resize((W, H), Image.Resampling.LANCZOS)
    return final_img

def generate_svg():
    svg_code = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="fastbilloGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="50%" stop-color="#16a34a" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
    <filter id="billShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0a3c19" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Square Green Box with Rounded Corners -->
  <rect x="16" y="16" width="480" height="480" rx="90" fill="url(#fastbilloGrad)" />
  <rect x="18" y="18" width="476" height="476" rx="88" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" />

  <!-- Middle Bill / Receipt Design -->
  <g filter="url(#billShadow)">
    <!-- White Receipt Body with Zigzag Perforation at Bottom -->
    <path d="
      M 145 75
      L 367 75
      A 14 14 0 0 1 381 89
      L 381 305
      L 367 317
      L 353 305
      L 339 317
      L 325 305
      L 311 317
      L 297 305
      L 283 317
      L 269 305
      L 255 317
      L 241 305
      L 227 317
      L 213 305
      L 199 317
      L 185 305
      L 171 317
      L 157 305
      L 143 317
      L 131 305
      L 131 89
      A 14 14 0 0 1 145 75
      Z
    " fill="#ffffff" />
  </g>

  <!-- Header Accent Pill -->
  <rect x="220" y="94" width="72" height="11" rx="5.5" fill="#16a34a" />

  <!-- Receipt Dots -->
  <circle cx="224" cy="116" r="2.5" fill="#cbd5e1" />
  <circle cx="256" cy="116" r="2.5" fill="#cbd5e1" />
  <circle cx="288" cy="116" r="2.5" fill="#cbd5e1" />

  <!-- Receipt Divider Line -->
  <line x1="151" y1="133" x2="361" y2="133" stroke="#e2e8f0" stroke-width="2" />

  <!-- Bill Item Lines -->
  <!-- Item 1 -->
  <rect x="153" y="150" width="115" height="7.5" rx="3.75" fill="#94a3b8" />
  <rect x="315" y="150" width="46" height="7.5" rx="3.75" fill="#94a3b8" />

  <!-- Item 2 -->
  <rect x="153" y="172" width="95" height="7.5" rx="3.75" fill="#cbd5e1" />
  <rect x="323" y="172" width="38" height="7.5" rx="3.75" fill="#cbd5e1" />

  <!-- Item 3 -->
  <rect x="153" y="194" width="125" height="7.5" rx="3.75" fill="#cbd5e1" />
  <rect x="310" y="194" width="51" height="7.5" rx="3.75" fill="#cbd5e1" />

  <!-- Item 4 -->
  <rect x="153" y="216" width="85" height="7.5" rx="3.75" fill="#e2e8f0" />
  <rect x="325" y="216" width="36" height="7.5" rx="3.75" fill="#e2e8f0" />

  <!-- Dashed Line before Total -->
  <line x1="151" y1="239" x2="361" y2="239" stroke="#94a3b8" stroke-width="2.5" stroke-dasharray="6,5" />

  <!-- Total Row in Green -->
  <rect x="153" y="255" width="75" height="12" rx="4" fill="#16a34a" />
  <rect x="295" y="255" width="66" height="12" rx="4" fill="#16a34a" />

  <!-- Mini Barcode at Receipt Bottom -->
  <g fill="#475569">
    <rect x="160" y="281" width="3" height="14" />
    <rect x="166" y="281" width="5" height="14" />
    <rect x="174" y="281" width="2" height="14" />
    <rect x="179" y="281" width="4" height="14" />
    <rect x="186" y="281" width="6" height="14" />
    <rect x="195" y="281" width="3" height="14" />
    <rect x="201" y="281" width="5" height="14" />
    <rect x="209" y="281" width="2" height="14" />
    <rect x="214" y="281" width="6" height="14" />
    <rect x="223" y="281" width="3" height="14" />
    <rect x="229" y="281" width="4" height="14" />
    <rect x="236" y="281" width="6" height="14" />
    <rect x="245" y="281" width="3" height="14" />
    <rect x="251" y="281" width="5" height="14" />
    <rect x="259" y="281" width="2" height="14" />
    <rect x="264" y="281" width="5" height="14" />
    <rect x="272" y="281" width="3" height="14" />
    <rect x="278" y="281" width="6" height="14" />
    <rect x="287" y="281" width="4" height="14" />
    <rect x="294" y="281" width="2" height="14" />
    <rect x="299" y="281" width="5" height="14" />
    <rect x="307" y="281" width="3" height="14" />
    <rect x="313" y="281" width="6" height="14" />
    <rect x="322" y="281" width="4" height="14" />
    <rect x="329" y="281" width="3" height="14" />
    <rect x="335" y="281" width="5" height="14" />
    <rect x="343" y="281" width="4" height="14" />
    <rect x="350" y="281" width="2" height="14" />
  </g>

  <!-- Below the Design: FASTBILLO in White Color -->
  <text x="256" y="420"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Helvetica Neue', Arial, sans-serif"
        font-size="52"
        font-weight="900"
        letter-spacing="2.5"
        fill="#ffffff"
        text-anchor="middle">FASTBILLO</text>
</svg>
"""
    return svg_code

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # 1. Generate SVG
    svg_content = generate_svg()
    
    # Ensure directories exist
    public_dir = os.path.join(base_dir, 'public')
    mobile_assets_dir = os.path.join(base_dir, 'mobile', 'assets')
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(mobile_assets_dir, exist_ok=True)

    # Save SVGs
    with open(os.path.join(public_dir, 'fastbillo-logo.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("Saved public/fastbillo-logo.svg & public/favicon.svg")

    # 2. Generate Master PNG
    master_png = generate_logo_png()

    # Save to public
    master_png.save(os.path.join(public_dir, 'fastbillo-logo.png'), format='PNG')
    
    # Save favicon pngs
    fav_64 = master_png.resize((64, 64), Image.Resampling.LANCZOS)
    fav_64.save(os.path.join(public_dir, 'favicon.png'), format='PNG')
    fav_192 = master_png.resize((192, 192), Image.Resampling.LANCZOS)
    fav_192.save(os.path.join(mobile_assets_dir, 'favicon.png'), format='PNG')

    # Save mobile icon (1024x1024)
    master_png.save(os.path.join(mobile_assets_dir, 'icon.png'), format='PNG')

    # Save mobile splash icon
    splash = master_png.resize((512, 512), Image.Resampling.LANCZOS)
    splash.save(os.path.join(mobile_assets_dir, 'splash-icon.png'), format='PNG')

    # Android foreground & background
    master_png.save(os.path.join(mobile_assets_dir, 'android-icon-foreground.png'), format='PNG')
    
    # Android background (plain solid green)
    bg_img = Image.new('RGBA', (1024, 1024), (22, 163, 74, 255))
    bg_img.save(os.path.join(mobile_assets_dir, 'android-icon-background.png'), format='PNG')

    print("All branding PNG and SVG assets generated successfully!")
