export const uploadToCloudinary = async (file: File) => {
  const cloudName = "YOUR_CLOUD_NAME"; // 👈 Paste your Cloud Name here
  const uploadPreset = "YOUR_PRESET_NAME"; // 👈 Paste your Unsigned Preset Name here

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  // Optional: Auto-compress images to standard quality
  // formData.append("quality", "auto"); 
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Image upload failed");
    }

    // Return the URL of the uploaded image
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw error;
  }
};