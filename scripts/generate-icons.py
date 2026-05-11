#!/usr/bin/env python3
"""Generate PWA icons for WHU Food Guide."""

import os

def create_svg_icon(size: int, is_maskable: bool = False) -> str:
    """Create an SVG icon."""
    # For maskable icons, add padding
    padding = int(size * 0.1) if is_maskable else 0
    inner_size = size - 2 * padding

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{size // 8}" fill="url(#bg)"/>
  <g transform="translate({padding + inner_size * 0.2}, {padding + inner_size * 0.15})">
    <!-- Bowl -->
    <ellipse cx="{inner_size * 0.3}" cy="{inner_size * 0.45}" rx="{inner_size * 0.25}" ry="{inner_size * 0.12}" fill="white" opacity="0.9"/>
    <path d="M{inner_size * 0.05} {inner_size * 0.45} Q{inner_size * 0.05} {inner_size * 0.7} {inner_size * 0.3} {inner_size * 0.7} Q{inner_size * 0.55} {inner_size * 0.7} {inner_size * 0.55} {inner_size * 0.45}" fill="white" opacity="0.9"/>
    <!-- Steam -->
    <path d="M{inner_size * 0.2} {inner_size * 0.25} Q{inner_size * 0.25} {inner_size * 0.15} {inner_size * 0.2} {inner_size * 0.05}" stroke="white" stroke-width="{inner_size * 0.02}" fill="none" opacity="0.6"/>
    <path d="M{inner_size * 0.3} {inner_size * 0.25} Q{inner_size * 0.35} {inner_size * 0.12} {inner_size * 0.3} {inner_size * 0.02}" stroke="white" stroke-width="{inner_size * 0.02}" fill="none" opacity="0.6"/>
    <path d="M{inner_size * 0.4} {inner_size * 0.25} Q{inner_size * 0.45} {inner_size * 0.15} {inner_size * 0.4} {inner_size * 0.05}" stroke="white" stroke-width="{inner_size * 0.02}" fill="none" opacity="0.6"/>
    <!-- Chopsticks -->
    <line x1="{inner_size * 0.55}" y1="{inner_size * 0.1}" x2="{inner_size * 0.4}" y2="{inner_size * 0.55}" stroke="white" stroke-width="{inner_size * 0.025}" stroke-linecap="round"/>
    <line x1="{inner_size * 0.6}" y1="{inner_size * 0.12}" x2="{inner_size * 0.45}" y2="{inner_size * 0.55}" stroke="white" stroke-width="{inner_size * 0.025}" stroke-linecap="round"/>
  </g>
  <text x="{size // 2}" y="{size * 0.88}" text-anchor="middle" fill="white" font-size="{size * 0.08}" font-family="system-ui, sans-serif" font-weight="bold">武大美食</text>
</svg>'''


def main():
    icons_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "icons")
    os.makedirs(icons_dir, exist_ok=True)

    icons = [
        (192, False, "icon-192.svg"),
        (512, False, "icon-512.svg"),
        (512, True, "icon-maskable-512.svg"),
    ]

    for size, is_maskable, filename in icons:
        svg_content = create_svg_icon(size, is_maskable)
        filepath = os.path.join(icons_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Created {filepath}")

    print("\nSVG icons created. For PNG conversion, use:")
    print("  pip install cairosvg")
    print("  python3 -c \"import cairosvg; cairosvg.svg2png(url='public/icons/icon-192.svg', write_to='public/icons/icon-192.png', output_width=192, output_height=192)\"")


if __name__ == "__main__":
    main()
