import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ======== CONFIGURACIÓN GENERAL ========
BASE_IMAGE = r"C:\Users\abofi\OneDrive\MyStudio\Projects\Academic\Book Locator\bjff-book-locator\backend\src\utils\Imagenes\Mueble.png"

MODE = "final"              # "preview" para ver las 40 cajas, "final" para generar las 160

COLS, ROWS = 8, 5
MODULES = [1, 2]
FACES = [("front", "Frontal"), ("back", "Trasera")]
OUT_PREVIEW = "output_preview"
OUT_FINAL = "output_final"

IMG_W, IMG_H = 2000, 700
TITLE_H = 64
MARGIN = 18

# ======== ESTILO VISUAL ========
HL_FILL   = (255, 230, 120, 190)
HL_BORDER = (215, 145, 0, 255)
TEXT_COLOR= (30, 30, 30)
GLOW_COLOR= (255, 200, 80, 120)
LABEL_TEXT= "!!!"
FONT_PATH = None

# ======== POSICIONES CALIBRADAS (en proporción al alto total del lienzo) ========
# Estas alturas fueron medidas según tu referencia con las líneas rojas
Y_TOPS = [0.132, 0.285, 0.439, 0.592, 0.745]     # límites superiores de cada anaquel
Y_BOTTOMS = [0.260, 0.414, 0.567, 0.720, 0.875]  # límites inferiores de cada anaquel

# Desplazamientos por fila (mismo signo para top y bottom)
# + baja la caja | - la sube
ROW_SHIFT = [  # proporciones del alto total (IMG_H)
    +0.080,   # fila 1 → más abajo
    +0.040,   # fila 2 → más abajo
     0.000,   # fila 3 → OK
     0.000,   # fila 4 → OK
    -0.045    # fila 5 → más arriba
]


# Margen horizontal del conjunto de estanterías (proporciones del ancho total)
X_LEFT, X_RIGHT = 0.018, 0.982

# ======== FUNCIONES ========
def load_font(size):
    try:
        if FONT_PATH:
            return ImageFont.truetype(FONT_PATH, size)
    except Exception:
        pass
    return ImageFont.load_default()

def load_base_canvas():
    base = Image.open(BASE_IMAGE).convert("RGBA")
    base = base.resize((IMG_W, IMG_H - TITLE_H), Image.LANCZOS)
    canvas = Image.new("RGBA", (IMG_W, IMG_H), (250,250,252,255))
    canvas.paste(base, (0, TITLE_H), base)
    return canvas

def get_rect(col, row):
    """Devuelve (x0,y0,x1,y1) aplicando desplazamiento por fila."""
    usable_width = X_RIGHT - X_LEFT
    col_w = usable_width / COLS

    x0 = (X_LEFT + col * col_w) * IMG_W
    x1 = (X_LEFT + (col + 1) * col_w) * IMG_W

    # shift por fila (mismo para top y bottom)
    dy = ROW_SHIFT[row] * IMG_H
    y0 = Y_TOPS[row]    * IMG_H + dy
    y1 = Y_BOTTOMS[row] * IMG_H + dy

    inset = 6
    return (x0+inset, y0+inset, x1-inset, y1-inset)

def glow(img, rect, blur=14, grow=8):
    w,h = img.size
    gimg = Image.new("RGBA", (w,h), (0,0,0,0))
    g = ImageDraw.Draw(gimg)
    x0,y0,x1,y1 = rect
    for i in range(grow):
        g.rectangle([x0-i,y0-i,x1+i,y1+i], outline=GLOW_COLOR, width=4)
    gimg = gimg.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(gimg)

def highlight(img, rect, label=True):
    o = Image.new("RGBA", img.size, (0,0,0,0))
    d = ImageDraw.Draw(o)
    d.rounded_rectangle(rect, radius=12, fill=HL_FILL, outline=HL_BORDER, width=5)
    if label:
        f = load_font(28)
        tb = d.textbbox((0,0), LABEL_TEXT, font=f)
        tw, th = tb[2]-tb[0], tb[3]-tb[1]
        x0,y0,x1,y1 = rect
        d.text((x0+(x1-x0-tw)//2 + 2, y0+(y1-y0-th)//2 + 2), LABEL_TEXT, font=f, fill=(0,0,0,110))
        d.text((x0+(x1-x0-tw)//2,     y0+(y1-y0-th)//2),     LABEL_TEXT, font=f, fill=TEXT_COLOR)
    img.alpha_composite(o)

def header_footer(img, title, shelf, rack):
    d = ImageDraw.Draw(img)
    f1 = load_font(26); f2 = load_font(22)
    tb = d.textbbox((0,0), title, font=f1)
    d.text(((IMG_W-(tb[2]-tb[0]))//2, (TITLE_H-(tb[3]-tb[1]))//2), title, font=f1, fill=TEXT_COLOR)
    info = f"Estantería {shelf} | Anaquel {rack}"
    ib = d.textbbox((0,0), info, font=f2)
    d.text((IMG_W-MARGIN-(ib[2]-ib[0]), IMG_H-MARGIN-(ib[3]-ib[1])), info, font=f2, fill=TEXT_COLOR)

# ======== GENERAR PREVIEW ========
def preview_positions():
    os.makedirs(OUT_PREVIEW, exist_ok=True)
    img = load_base_canvas()
    draw = ImageDraw.Draw(img)
    for c in range(COLS):
        for r in range(ROWS):
            rect = get_rect(c, r)
            draw.rectangle(rect, outline=(255,0,0), width=3)
    img.convert("RGB").save(os.path.join(OUT_PREVIEW, "_preview.jpg"), quality=95)
    print("✅ Preview creada en:", os.path.join(OUT_PREVIEW, "_preview.jpg"))

# ======== GENERAR 160 ========
def generate_all():
    os.makedirs(OUT_FINAL, exist_ok=True)
    for module in MODULES:
        for face_key, face_text in FACES:
            for s in range(1, COLS+1):
                for r in range(1, ROWS+1):
                    img = load_base_canvas()
                    rect = get_rect(s-1, r-1)
                    glow(img, rect)
                    highlight(img, rect, label=True)
                    title = f"Módulo {module} | Cara: {face_text}"
                    header_footer(img, title, s, r)
                    out_dir = os.path.join(OUT_FINAL, f"module{module}", face_key)
                    os.makedirs(out_dir, exist_ok=True)
                    img.convert("RGB").save(os.path.join(out_dir, f"s{s}_r{r}.jpg"), quality=95)
    print("✅ 160 imágenes generadas en:", OUT_FINAL)

# ======== MAIN ========
if __name__ == "__main__":
    if MODE == "preview":
        preview_positions()
    else:
        generate_all()
