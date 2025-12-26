import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import cors from "cors";
import ColorThief from "colorthief";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import namer from "color-namer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl|| !supabaseKey) 
{
  console.error("Please set SUPABASE_URL and SUPABASE_KEY in .env");
  process.exit(1);
}


let supabase;
try 
{
  supabase = createClient(supabaseUrl, supabaseKey);
} 
catch (err) 
{
  console.error("Error creating Supabase client:", err?.message || err);
  process.exit(1);
}


const TEMP_DIR = path.join(__dirname, "uploads_temp");
if (!fsSync.existsSync(TEMP_DIR)) 
{
  fsSync.mkdirSync(TEMP_DIR, { recursive: true });
}


const upload = multer({

  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {

    if (file.mimetype && file.mimetype.startsWith("image/")) 
      cb(null, true);

    else 
      cb(new Error("Only image files are allowed!"), false);
  }
});


function rgbToHex(r, g, b) 
{
  const toHex = (x) => {
    const hex = Number(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}


async function writeTempFile(buffer, ext = "jpg") {
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(TEMP_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return filepath;
}


(async () => {
  try 
  {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) 
    {
      console.warn("Supabase: could not list buckets (check key permissions):", error.message);
    }
    else 
    {
      console.log("Supabase buckets:", data.map((b) => b.name));
    }
  } 
  catch (err) 
  {
    console.warn("Supabase connection check failed:", err.message);
  }
})();


app.post("/addGuitar", upload.array("images", 10), async (req, res) => {
  
  try 
  {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: "No images provided" });

    const guitarData = JSON.parse(req.body.guitarData);
    console.log("Received Guitar Data:", guitarData);

    const { generalBasic, generalColor, generalDetails, generalSpecs } = guitarData;

    // latest id for guitars_basic
    const { data: latestBasic, error: latestError } = await supabase
      .from("guitars_basic")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (latestError) 
      throw latestError;

    const newGuitarId = latestBasic?.length > 0 ? latestBasic[0].id + 1 : 1;

    // guitars_basic
    const { error: basicError } = await supabase.from("guitars_basic").insert([
      {
        id: newGuitarId,
        "name of the guitar": generalBasic.name || "Unnamed Guitar",
        price: generalBasic.price || 0
      },
    ]);

    if (basicError) 
      throw basicError;


    console.log(generalColor);
    

    // guitars_colors
    const colorInserts = (generalColor.color || []).map((c) => ({
      id: newGuitarId,
      colour_code: c.hex,
      quantity: c.quantity || 1
    }));

    if (colorInserts.length > 0) 
    {
      const { error: colorErr } = await supabase
        .from("guitars_colors")
        .insert(colorInserts);

      if (colorErr) 
        throw colorErr;
    }


    // guitars_details
    const details = generalDetails;
    const { error: detailsErr } = await supabase.from("guitars_details").insert([
      {
        id: newGuitarId,
        "Top Material": details.topMaterial,
        "Back and Neck Material": details.backAndNeckMaterial,
        "Fingerboard and Bridge Material": details.fingerboardBridgeMaterial,
        "Warranty": details.warranty,
        "Body_Shape": details.bodyShape
      },
    ]);

    if (detailsErr) 
      throw detailsErr;


    // guitars_specs
    const specs = generalSpecs;
    const { error: specsErr } = await supabase.from("guitars_specs").insert([
      {
        id: newGuitarId,
        "Scale Length": specs.scaleLength,
        "Body Length": specs.bodyLength,
        "Total Length": specs.totalLength,
        "Body Width": specs.bodyWidth,
        "Body Depth": specs.bodyDepth,
        "Nut Width": specs.nutWidth,
        "String Spacing": specs.stringSpacing,
        "Side Material": specs.sideMaterial,
        "Fingerboard Radius": specs.fingerBoardRadius,
        "Nut Material": specs.nutMaterial,
        "Saddle Material": specs.saddleMaterial,
        "Bridge Pins": specs.bridgePins,
        "Tuners": specs.tuner,
        "Body Binding": specs.bodyBinding,
        "Soundhole Inlay": specs.soundholeInlay,
        "Pickguard": specs.pickguard,
        "Body Finish": specs.bodyFinish,
        "Neck Finish": specs.neckFinish,
        "Electronics": specs.electronics,
        "Controls": specs.controls,
        "Connections": specs.connections,
        "Strings": specs.strings,
        "Accessories": specs.accessories,
        "Case": specs.case,
      },
    ]);
    if (specsErr) 
      throw specsErr;

    // Upload each image
    const uploadResults = await Promise.all(
      req.files.map(async (file) => {
        const ext = path.extname(file.originalname);
        const fileName = `${uuidv4()}${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("guitars-images")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) 
          throw uploadError;

        const { data: urlData } = supabase.storage
          .from("guitars-images")
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        const { data: latestImage, error: latestImgError } = await supabase
          .from("guitars_image")
          .select("id")
          .order("id", { ascending: false })
          .limit(1);

        if (latestImgError) throw latestImgError;
        const newImageId = latestImage?.length > 0 ? latestImage[0].id + 1 : 1;

        const { error: insertError } = await supabase
          .from("guitars_image")
          .insert([
            {
              id: newImageId,
              guitar_id: newGuitarId,
              image_url: imageUrl,
            },
          ]);

        if (insertError) 
          throw insertError;

        return { fileName, publicUrl: imageUrl };
      })
    );

    res.status(200).json({
      message: "Guitar and images uploaded successfully!",
      id: newGuitarId,
      uploadedImages: uploadResults,
    });
  } 
  catch (error) 
  {
    console.error("Upload error:", error);

    res.status(500).json({
      error: "Failed to upload guitar data",
      details: error.message,
    });
  }
});


app.post("/upload", upload.single("image"), async (req, res) => {
  try 
  {
    if (!req.file) 
    {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const ext = path.extname(req.file.originalname || ".jpg").slice(1);
    const tempPath = await writeTempFile(req.file.buffer, ext);

    const rgb = await ColorThief.getColor(tempPath).catch(() => null);
    await fs.unlink(tempPath).catch(() => {});

    if (!rgb) 
    {
      return res.status(500).json({ success: false, message: "Failed to extract color" });
    }

    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    const colorName = namer(hex)?.ntc?.[0]?.name || "Unknown";

    return res.status(200).json({
      success: true,
      dominantColor: { rgb, hex, name: colorName },
    });
  } 
  catch (err) 
  {
    console.error("/upload error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});


app.post("/color", (req, res) => {
  try 
  {
    const { r, g, b, hex } = req.body;

    if (
      (r !== undefined && (isNaN(r) || r < 0 || r > 255)) ||
      (g !== undefined && (isNaN(g) || g < 0 || g > 255)) ||
      (b !== undefined && (isNaN(b) || b < 0 || b > 255))
    ) {
      return res.status(400).json({ success: false, message: "Invalid RGB values" });
    }

    const finalHex = hex || rgbToHex(r, g, b);
    const colorName = namer(finalHex).ntc[0].name || "Unknown";

    return res.json({
      success: true,
      color: {
        rgb: [r, g, b],
        hex: finalHex,
        name: colorName,
      },
    });
  } 
  catch (err) 
  {
    console.error("Color processing error:", err);
    return res.status(500).json({ success: false, message: "Failed to process color" });
  }
});


app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running!" });
});


// Fetch Colors
app.get("/colors", async (req, res) => {

  try
  {
    const { data, error } = await supabase
      .from("guitars_colors")
      .select("colour_code");

    if (error) 
      throw error;


    const uniqueColors = [...new Set(data.map(c => c.colour_code))];
    console.log(uniqueColors);


    res.json({ colors: uniqueColors });
  } 
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});


// range 
app.get("/range", async (req, res) => {

  try 
  {
    const { data, error } = await supabase
      .from("guitars_basic")
      .select("price");

    if (error) 
      throw error;

    const prices = data.map(item => item.price);

    const max = Math.max(...prices);

    res.json({ maximum_Value: max });
  } 
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});


// Fetch Shapes
app.get("/shapes", async (req, res) => {

  try 
  {
    const { data, error } = await supabase
      .from("guitars_details")
      .select("Body_Shape");  

    if (error) 
      throw error;

    const uniqueShape = [...new Set(data.map(item => item.Body_Shape).filter(Boolean))];

    res.json({ shapes: uniqueShape });
  } 
  catch (err)
  {
    res.status(500).json({ error: err.message });
  }
});


// Fetch Materials
app.get("/materials", async (req, res) => {

  try 
  {
    const { data, error } = await supabase
      .from("guitars_details")
      .select(`"Top Material"`);   // Correct quoting

    if (error) 
      throw error;

    const uniqueMaterial = [
      ...new Set(data.map(item => item["Top Material"]).filter(Boolean))
    ];

    res.json({ materials: uniqueMaterial });
  }
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});


// Fetch Body Finishes
app.get("/bodyFinishes", async (req, res) => {

  try 
  {
    const { data, error } = await supabase
      .from("guitars_specs")
      .select(`"Body Finish"`);   // Correct quoting

    if (error) 
      throw error;

    const uniqueBodyFinish = [
      ...new Set(data.map(item => item["Body Finish"]).filter(Boolean))
    ];

    res.json({ bodyFinishes: uniqueBodyFinish });
  }
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});


// Fetch Cases
app.get("/cases", async (req, res) => {

  try 
  {
    const { data, error } = await supabase
      .from("guitars_specs")
      .select(`"Case"`);   // Correct quoting

    if (error) 
      throw error;

    const uniqueCase = [
      ...new Set(data.map(item => item["Case"]).filter(Boolean))
    ];

    res.json({ cases: uniqueCase });
  }
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});


// Fetch all guitars
app.get("/api/guitars", async (req, res) => {

  try 
  {
    const { data, error } = await supabase
      .from("guitars_basic")
      .select(`
        id,
        "name of the guitar",
        price,
        guitars_image (id, guitar_id, image_url),
        guitars_colors (id, colour_code, quantity),
        guitars_specs (*),
        guitars_details (*)
      `);

    if (error) 
    {
      console.error("Supabase error:", error);

      return res.status(500).json({ error: error.message });
    }

    const formatted = (data || []).map((g) => ({
      id: g.id,
      name: g["name of the guitar"],
      price: g.price,
      images:
        g.guitars_image?.map((i) => ({
          id: i.id,
          guitar_id: i.guitar_id,
          url: i.image_url,
        })) || [],
      colors:
        g.guitars_colors?.map((c) => ({
          id: c.id,
          code: c.colour_code,
          quantity: c.quantity,
        })) || [],
      specs: g.guitars_specs || [],
      details: g.guitars_details || {},
    }));

    res.json(formatted);
  } 
  catch (err) 
  {
    console.error("API handler error:", err?.stack || err);
    res.status(500).json({ error: "Server error" });
  }
});


// Fetch single guitar by slug
app.get("/api/guitars/:slug", async (req, res) => {

  try 
  {
    const { slug } = req.params;
    const guitarName = slug.replace(/-/g, " ");

    const { data, error } = await supabase
      .from("guitars_basic")
      .select(`
        id,
        "name of the guitar",
        price,
        guitars_image (id, guitar_id, image_url),
        guitars_colors (id, colour_code, quantity),
        guitars_specs (*),
        guitars_details (*)
      `)
      .ilike("name of the guitar", guitarName)
      .single();

    if (error || !data) 
    {
      return res.status(404).json({ error: "Guitar not found" });
    }

    const formatted = {
      id: data.id,
      name: data["name of the guitar"],
      price: data.price,
      images:
        data.guitars_image?.map((i) => ({
          id: i.id,
          guitar_id: i.guitar_id,
          url: i.image_url,
        })) || [],
      colors:
        data.guitars_colors?.map((c) => ({
          id: c.id,
          code: c.colour_code,
          quantity: c.quantity,
        })) || [],
      specs: data.guitars_specs || [],
      details: data.guitars_details || {},
    };

    res.json(formatted);
  } 
  catch (err) 
  {
    console.error("API /guitars/:slug error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// the slug route
app.get("/guitar/:id/:slug", (req, res, next) => {

  if (req.params.slug.includes(".")) 
    return next();

  res.sendFile(path.join(__dirname, "public", "guitar.html"));
});


app.post("/api/payment", async (req, res) => {

  try 
  {
    let { name, phone, amount, reference } = req.body;

    // Validate required fields
    if (!name || !phone || !amount || !reference) 
    {
      return res.status(400).json({ error: "Missing required fields" });
    }

    amount = Number(amount);

    if (isNaN(amount) || amount <= 0) 
    {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Environment variables
    const upiId = process.env.UPI_ID;
    const upiName = encodeURIComponent(process.env.UPI_NAME);
    const note = encodeURIComponent(process.env.UPI_NOTE);
    const defaultWhatsapp = process.env.DEFAULT_WHATSAPP;

    // Generate UPI deep link
    const upiLink =
      `upi://pay?pa=${upiId}&pn=${upiName}&am=${amount}&cu=INR&tn=${note}`;

    // WhatsApp message
    const whatsappMsg = encodeURIComponent(
      `Hello ${name},\nPlease complete your payment of ₹${amount} for order *${reference}*.\n\nClick here:\n${upiLink}\n\nYou can use Google Pay, PhonePe, Paytm, or BHIM.`
    );

    // Final WhatsApp URL
    const whatsappNumber = `91${phone.replace(/\D/g, "")}` || defaultWhatsapp;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMsg}`;

    return res.json({
      success: true,
      message: "Payment link generated successfully",
      upiLink,
      whatsappUrl,
      name
    });

  } 
  catch (err) 
  {
    console.error("Error generating link:", err);
    return res.status(500).json({ error: "Failed to process payment" });
  }
});


app.post("/api/completeOrder", async (req, res) => {

  try 
  {
    const { user_Id, name, phone, totalAmount, items } = req.body;

    if (!user_Id || !name || !phone || !totalAmount || !items || items.length === 0) 
    {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // 1. Insert into customer_table
    const { error: customerErr } = await supabase
      .from("customer_table")
      .insert([
        {
          user_Id: user_Id,
          Name: name,
          Ref_No: user_Id,
          Mob_No: phone,
          Total_Amt: String(totalAmount)
        }
      ]);

    if (customerErr) 
    {
      console.error("Customer table error:", customerErr);
      return res.json({ success: false, error: customerErr.message });
    }

    // 2. Process each bought item
    for (const item of items) 
    {
      const guitarId = item.guitarId;
      const colorCode = item.color_code;
      const boughtQty = Number(item.quantity);

      // Fetch current stock for that color
      const { data: colorRow, error: fetchErr } = await supabase
        .from("guitars_colors")
        .select("quantity")
        .eq("id", guitarId)
        .eq("colour_code", colorCode)
        .single();

      if (fetchErr || !colorRow) 
      {
        console.error("Fetch error:", fetchErr);
        continue;
      }

      const newQty = colorRow.quantity - boughtQty;

      // 2A. Update stock (even if it becomes zero)
      const { error: updateErr } = await supabase
        .from("guitars_colors")
        .update({ quantity: newQty })
        .eq("id", guitarId)
        .eq("colour_code", colorCode);

      if (updateErr) 
      {
        console.error("Stock update error:", updateErr);
      }

      // 3. Insert into order_table
      const { error: orderErr } = await supabase
        .from("order_table")
        .insert([
          {
            user_Id: user_Id,
            guitar_Id: guitarId,
            color_code: colorCode,
            quantity: boughtQty
          }
        ]);

      if (orderErr) 
      {
        console.error("Order insert error:", orderErr);
      }
    }

    return res.json({ success: true });

  } 
  catch (err) 
  {
    console.error("Complete order error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});


app.get("/api/inventory", async (req, res) => {

  try 
  {
    const { data: basic } = await supabase
      .from("guitars_basic")
      .select(`id, "name of the guitar", price`);

    const { data: images } = await supabase
      .from("guitars_image")
      .select("id, image_url");

    const { data: colors } = await supabase
      .from("guitars_colors")
      .select("id, colour_code, quantity");

    const result = basic.map(g => ({
      id: g.id,
      name: g["name of the guitar"],
      price: g.price,
      image_url: images.find(i => i.id === g.id)?.image_url || "",
      variants: colors.filter(c => c.id === g.id)
    }));

    res.json({ success: true, data: result });
  } 
  catch (err) 
  {
    console.log("GET ALL ERROR:", err);
    res.json({ success: false });
  }
});


app.get("/api/inventory/:id", async (req, res) => {

  const id = req.params.id;

  try 
  {
    const { data: basic } = await supabase
      .from("guitars_basic")
      .select("*")
      .eq("id", id)
      .single();

    const { data: details } = await supabase
      .from("guitars_details")
      .select("*")
      .eq("id", id)
      .single();

    const { data: specs } = await supabase
      .from("guitars_specs")
      .select("*")
      .eq("id", id)
      .single();

    const { data: colors } = await supabase
      .from("guitars_colors")
      .select("*")
      .eq("id", id);

    const { data: image } = await supabase
      .from("guitars_image")
      .select("image_url")
      .eq("id", id)
      .single();

    res.json({
      success: true,
      data: {
        id,
        name: basic["name of the guitar"],
        price: basic.price,
        image_url: image?.image_url || "",
        details,
        specs,
        colors
      }
    });
  } 
  catch (err) 
  {
    console.log("FETCH ONE ERROR:", err);
    res.json({ success: false });
  }
});


app.put("/api/inventory/:id", async (req, res) => {

  const id = req.params.id;
  const body = req.body;

  try 
  {
    await supabase
      .from("guitars_basic")
      .update({
        "name of the guitar": body.name,
        price: body.price
      })
      .eq("id", id);

    await supabase.from("guitars_details").update(body.details).eq("id", id);
    await supabase.from("guitars_specs").update(body.specs).eq("id", id);

    await supabase.from("guitars_colors").delete().eq("id", id);

    for (const c of body.colors) 
    {
      await supabase.from("guitars_colors").insert({
        id: id,
        colour_code: c.colour_code,
        quantity: c.quantity
      });
    }

    res.json({ success: true });
  } 
  catch (err) 
  {
    console.log("UPDATE ERROR:", err);
    res.json({ success: false });
  }
});


app.post("/api/updateStock", async (req, res) => {

  try 
  {
    const items = req.body.items; // array of { id, color, quantity }

    for (const item of items) 
    {
      const { id, color, quantity } = item;

      // Fetch current quantity
      const { data, error } = await supabase
        .from("guitars_colors")
        .select("quantity")
        .eq("id", id)
        .eq("colour_code", color)
        .single();

      if (error) 
        throw error;

      const newQty = (data.quantity || 0) - quantity;

      if (newQty < 0) 
      {
        return res.status(400).json({
          error: "Not enough stock for some items",
        });
      }

      // Update quantity
      const { error: updateErr } = await supabase
        .from("guitars_colors")
        .update({ quantity: newQty })
        .eq("id", id)
        .eq("colour_code", color);

      if (updateErr) 
        throw updateErr;
    }

    return res.json({ success: true });

  } 
  catch (err) 
  {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
});


app.use((_, res) => {
  res.status(404).send("Not Found");
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});