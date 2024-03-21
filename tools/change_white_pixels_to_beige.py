import sys
from pathlib import Path

from PIL import Image

if len(sys.argv) != 3:
    print(f"USAGE: {__file__} input.png output.png")

image_path = sys.argv[1]
output_path = sys.argv[2]

if not output_path.endswith(".png"):
    output_path += ".png"

beige=(245, 241, 222) # color code is #f5f1de
white = (255,255,255)

# Open the image
img = Image.open(image_path)
width, height = img.size

for x in range(width):
    for y in range(height):
        pixel_color = img.getpixel((x, y))
        # Check if the pixel is white (RGB value of 255, 255, 255)
        if pixel_color == white:
            # Change white pixels to beige
            img.putpixel((x, y), beige)

img.save(output_path)

# Example usage
# change_white_to_beige("input_image.png")
