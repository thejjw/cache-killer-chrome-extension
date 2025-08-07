# SPDX-License-Identifier: zlib-acknowledgement
# Copyright (c) 2025 @thejjw
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon_with_c(size, active=False):
    # Create a square image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    if active:
        bg_color = (255, 68, 68, 255)  # Red background when active
        text_color = (255, 255, 255, 255)  # White text
    else:
        bg_color = (128, 128, 128, 255)  # Gray background when inactive
        text_color = (255, 255, 255, 255)  # White text
    
    # Draw circle background
    margin = size // 10
    draw.ellipse([margin, margin, size-margin, size-margin], fill=bg_color)
    
    # Calculate font size based on icon size
    font_size = int(size * 0.6)  # 60% of icon size for the "C"
    
    try:
        # Try to use a system font, fallback to default if not available
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
    
    # Get text dimensions
    text = "C"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]  # Adjust for baseline
    
    # Draw the "C" letter
    draw.text((x, y), text, fill=text_color, font=font)
    
    return img

# Create icons with "C" letter
print("Creating icons with 'C' letter...")
for size in [16, 48, 128]:
    print(f"Creating {size}x{size} icons...")
    
    # Inactive (gray) icon
    gray_icon = create_icon_with_c(size, False)
    gray_icon.save(f'icon{size}.png')
    print(f"  ✓ icon{size}.png (inactive)")
    
    # Active (red) icon
    red_icon = create_icon_with_c(size, True)
    red_icon.save(f'icon{size}-active.png')
    print(f"  ✓ icon{size}-active.png (active)")

print("\n🎉 Icons with 'C' letter created successfully!")
print("\nIcon colors:")
print("  • Gray with white 'C' = Inactive/Disabled")
print("  • Red with white 'C' = Active/Enabled")