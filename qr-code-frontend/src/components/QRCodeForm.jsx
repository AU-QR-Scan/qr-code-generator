import React, { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import { supabase } from "../supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";


import {
  FaLink,
  FaEnvelope,
  FaComment,
  FaFilePdf,
  FaImages,
  FaTwitter,
  FaBitcoin,
  FaMusic,
  FaFacebook,
  FaWifi,
  FaApple,
  FaIdCard,
} from "react-icons/fa";
import "./QRCodeForm.css";

// ✅ Define the component function after imports
const QRCodeForm = () => {
  // State declarations
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [session, setSession] = useState(null);
  const [qrCodePNG, setQrCodePNG] = useState("");
  
  // Other state variables (for form fields)
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pdfURL, setPdfURL] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [twitterOption, setTwitterOption] = useState(null);
  const [mp3File, setMp3File] = useState(null);
  const [cryptoType, setCryptoType] = useState("");
  const [bitcoinReceiver, setBitcoinReceiver] = useState("");
  const [bitcoinAmount, setBitcoinAmount] = useState("");
  const [bitcoinMessage, setBitcoinMessage] = useState("");
  const [bitcoinAddress, setBitcoinAddress] = useState("");
  const [appStoreURL, setAppStoreURL] = useState("");
  const [vcardFirstName, setVcardFirstName] = useState("");
  const [vcardLastName, setVcardLastName] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardOrganization, setVcardOrganization] = useState("");
  const [vcardTitle, setVcardTitle] = useState("");
  const [facebookOption, setFacebookOption] = useState(null);
  const [facebookURL, setFacebookURL] = useState("");
  const [facebookPostText, setFacebookPostText] = useState("");
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState("WPA/WPA2");
  const [wifiHidden, setWifiHidden] = useState(false);

  // Backend server link (modify here with actual link)
  const BASE_URL = "http://localhost:5000";

  // Get current user ID
  const userId = session?.user?.id;


  // Styles
  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "opacity 0.3s ease",
  };

  const successMessageStyle = {
    position: "absolute",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 20px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    opacity: 0,
    animation: "slideDown 0.3s ease forwards",
  };

  //Google auth session
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);  

  // 1. Upload PDF File
  const uploadPDF = async (file) => {
    if (!session) {
      alert("You must be logged in to upload PDFs.");
      return;
    }
  
    const userId = session.user.id;
    const filePath = `${userId}/${file.name}`; // user's folder
  
    const { data, error } = await supabase.storage
      .from('pdf-files')
      .upload(filePath, file, { upsert: true }); // Allow overwrites
  
    if (error) {
      console.error("Failed to upload PDF:", error.message);
      alert("Upload failed! " + error.message);
      return null;
    }
  
    console.log("PDF uploaded successfully:", data);
  
    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pdf-files')
      .createSignedUrl(filePath, 3600); //Expires in 1 hour
  
    if (signedUrlError) {
      console.error("Failed to generate signed URL:", signedUrlError.message);
      alert("Failed to retrieve file!");
      return null;
    }
  
    console.log("Signed URL:", signedUrlData.signedUrl);
    return signedUrlData.signedUrl;
  };
  
  
  // 2. Upload Photo Gallery
  const uploadPhotos = async (files) => {
    if (!session) {
      alert("You must be logged in to upload photos.");
      return;
    }

    const userId = session.user.id;
    const urls = [];

    // Clean up old files before upload
    await cleanUpFiles('photo-gallery', 5, 2);

    for (const file of files) {
      const filePath = `${userId}/${file.name}`;

      const { data, error } = await supabase.storage
        .from('photo-gallery')
        .upload(filePath, file, { upsert: false });

      if (error) {
        console.error("Failed to upload photo:", error.message);
        continue;
      }

      // Generate a signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('photo-gallery')
        .createSignedUrl(filePath, 3600); 

      if (signedUrlError) {
        console.error("Failed to generate signed URL:", signedUrlError.message);
        continue;
      }

      urls.push(signedUrlData?.signedUrl);
    }

    return urls;
  };

  

  //3. Upload MP3 File
  const uploadMP3 = async (file) => {
    if (!session) {
      alert("You must be logged in to upload MP3s.");
      return;
    }

    const userId = session.user.id;
    const filePath = `${userId}/${file.name}`;

    // Clean up old MP3 files before upload
    await cleanUpFiles('mp3-files', 5, 2);

    const { data, error } = await supabase.storage
      .from('mp3-files')
      .upload(filePath, file, { upsert: false });

    if (error) {
      console.error("Failed to upload MP3:", error.message);
      alert("Upload failed!");
      return null;
    }

    // Generate a signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('mp3-files')
      .createSignedUrl(filePath, 3600); 

    if (signedUrlError) {
      console.error("Failed to generate signed URL:", signedUrlError.message);
      return null;
    }

    return signedUrlData?.signedUrl;
  };


  //Cleanup Old Files if Limit Exceeded (Now if a bucket has more than 50 files, it will delete the oldest 10 files)
  const cleanUpFiles = async (bucketName, fileLimit = 50, deleteCount = 10) => {
    if (!session) {
      console.error("No session found. Cannot clean up files.");
      return;
    }

    const userId = session.user.id;
    const folderPath = `${userId}/`;

    // List files in the user's folder only
    const { data: files, error } = await supabase.storage.from(bucketName).list(folderPath);

    if (error) {
      console.error(`Failed to list files in ${bucketName}/${folderPath}:`, error);
      return;
    }

    // Check if file count exceeds the limit
    if (files.length > fileLimit) {
      const sortedFiles = files.sort((a, b) => a.created_at.localeCompare(b.created_at));
      const filesToDelete = sortedFiles.slice(0, deleteCount).map(file => `${folderPath}${file.name}`);

      // Delete the selected files
      const { error: deleteError } = await supabase.storage.from(bucketName).remove(filesToDelete);

      if (deleteError) {
        console.error(`Failed to delete files in ${bucketName}/${folderPath}:`, deleteError);
      } else {
        console.log(`Deleted ${deleteCount} old files in ${bucketName}/${folderPath}`);
      }
    } else {
      console.log(`No cleanup needed for ${bucketName}/${folderPath}. File count is within the limit.`);
    }
  };



  //Generate QR Code (PNG) 
  const handleGenerate = async () => {
    let formattedText = "";
    try {
      setIsGenerating(true);
      setShowSuccess(false);
      switch (activeType) {
        case "url":
          if (!url.trim()) {
            alert("Please enter a valid URL.");
            return;
          }
          formattedText = url;
          break;
        case "message":
          if (!message.trim()) {
            alert("Please enter a message.");
            return;
          }
          formattedText = message;
          break;
        case "email":
          if (!email.trim() || !subject.trim() || !body.trim()) {
            alert("Please fill in all email fields.");
            return;
          }
          formattedText = `mailto:${email}?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(body)}`;
          break;
        case "pdf":
          if (pdfFile) {
            const fileUrl = await uploadPDF(pdfFile);
            if (!fileUrl) return;
            await cleanUpFiles("pdf-files");
            formattedText = fileUrl;
          } else if (pdfURL) {
            formattedText = pdfURL;
          } else {
            alert("Please upload a PDF file or provide a PDF URL.");
            return;
          }
          break;
        case "gallery":
          if (galleryFiles.length === 0) {
            alert("Please upload at least one photo.");
            return;
          }
          const urls = await uploadPhotos(galleryFiles);
          if (!urls || urls.length === 0) return;
          await cleanUpFiles("photo-gallery");
          formattedText = urls.join(", ");
          break;
        case "twitter":
          if (twitterOption === "twitter-profile") {
            if (!twitterHandle.trim()) {
              alert("Please enter a Twitter handle.");
              return;
            }
            formattedText = `https://twitter.com/${twitterHandle}`;
          } else if (twitterOption === "twitter-tweet") {
            if (!tweetText.trim()) {
              alert("Please enter a tweet.");
              return;
            }
            formattedText = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              tweetText
            )}`;
          } else {
            alert("Please select a Twitter option.");
            return;
          }
          break;
        case "bitcoin":
          if (
            !cryptoType.trim() ||
            !bitcoinReceiver.trim() ||
            !bitcoinAmount.trim() ||
            !bitcoinAddress.trim()
          ) {
            alert("Please fill in all required Bitcoin fields.");
            return;
          }
          formattedText = `${cryptoType.toLowerCase()}:${bitcoinAddress}?amount=${bitcoinAmount}&label=${encodeURIComponent(
            bitcoinReceiver
          )}`;
          if (bitcoinMessage.trim()) {
            formattedText += `&message=${encodeURIComponent(bitcoinMessage)}`;
          }
          break;
        case "mp3":
          if (!mp3File) {
            alert("Please upload an MP3 file.");
            return;
          }
          const mp3Url = await uploadMP3(mp3File);
          if (!mp3Url) return;
          await cleanUpFiles("mp3-files");
          formattedText = mp3Url;
          break;
        case "facebook":
          if (facebookOption === "facebook-url") {
            if (!facebookURL.trim()) {
              alert("Please enter a Facebook URL.");
              return;
            }
            formattedText = facebookURL;
          } else if (facebookOption === "facebook-post") {
            if (!facebookPostText.trim()) {
              alert("Please enter the text for your Facebook post.");
              return;
            }
            formattedText = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              "https://www.facebook.com"
            )}&quote=${encodeURIComponent(facebookPostText)}`;
          } else {
            alert("Please select a Facebook option.");
            return;
          }
          break;
        case "wifi":
          const ssid = wifiSSID.trim() || "SSID";
          let encryption;
          if (wifiEncryption === "without") {
            encryption = "nopass";
          } else if (wifiEncryption === "WPA/WPA2") {
            encryption = "WPA";
          } else if (wifiEncryption === "WEP") {
            encryption = "WEP";
          }
          formattedText = `WIFI:T:${encryption};S:${ssid};P:${wifiPassword};${
            wifiHidden ? "H:true;" : ""
          };`;
          break;
        case "appstore":
          if (!appStoreURL.trim()) {
            alert("Please enter an App Store URL.");
            return;
          }
          formattedText = appStoreURL;
          break;
        case "vcard":
          if (
            !vcardFirstName.trim() ||
            !vcardLastName.trim() ||
            !vcardPhone.trim() ||
            !vcardEmail.trim()
          ) {
            alert(
              "Please fill in required vCard fields (First Name, Last Name, Phone, Email)."
            );
            return;
          }
          formattedText = `BEGIN:VCARD
VERSION:3.0
N:${vcardLastName};${vcardFirstName};;;
FN:${vcardFirstName} ${vcardLastName}
TEL:${vcardPhone}
EMAIL:${vcardEmail}
${vcardOrganization.trim() ? `ORG:${vcardOrganization}` : ""}
${vcardTitle.trim() ? `TITLE:${vcardTitle}` : ""}
END:VCARD`;
          break;
        default:
          alert("Please select a type.");
          return;
      }

      // Generate PNG QR code
      const response = await fetch(`${BASE_URL}/api/generate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formattedText }),
      });
      const data = await response.json();
      setQrCodePNG(data.qrCodePNG);
      setQrCodePNG(data.qrCodePNG);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowSuccess(true);
    } catch (error) {
      alert("Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  
  };

  //Download PNG function:
 
  const handleDownloadPNG = () => {
    if (!qrCodePNG) {
      alert("Please generate a QR code first.");
      return;
    }
    try {
      
      const parts = qrCodePNG.split(",");
      if (parts.length !== 2) {
        alert("Invalid QR code data.");
        return;
      }
      const mimeString = parts[0].match(/:(.*?);/)[1];
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const blobURL = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobURL;
      link.download = "qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobURL);
    } catch (error) {
      alert("Error downloading PNG: " + error.message);
    }
  };

  //Logout Function
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Failed to log out: " + error.message);
    } else {
      setSession(null);
      alert("Logged out successfully!");
    }
  };


  

  return (
    <div className="QRCodeGenerator">
      <div className="user-info-container">
        {session ? (
          <>
            <p className="user-info-text">Signed in as: <strong>{session.user.email}</strong></p>
            <button onClick={handleLogout} className="logout-button">
              Log Out
            </button>
          </>
        ) : (
          <p className="user-info-text">Not signed in</p>
        )}
      </div>
      <div className="top-section">
        <div className="options-container">
          <h2>Choose Type</h2>
          <div className="options">
            <button onClick={() => setActiveType("url")}>
              <FaLink size={20} />
              <span>URL</span>
            </button>
            <button onClick={() => setActiveType("message")}>
              <FaComment size={20} />
              <span>Message</span>
            </button>
            <button onClick={() => setActiveType("email")}>
              <FaEnvelope size={20} />
              <span>Email</span>
            </button>
            <button onClick={() => setActiveType("pdf")}>
              <FaFilePdf size={20} />
              <span>PDF</span>
            </button>
            <button onClick={() => setActiveType("gallery")}>
              <FaImages size={20} />
              <span>Photo Gallery</span>
            </button>
            <button onClick={() => setActiveType("twitter")}>
              <FaTwitter size={20} />
              <span>Twitter</span>
            </button>
            <button onClick={() => setActiveType("bitcoin")}>
              <FaBitcoin size={20} />
              <span>Bitcoin</span>
            </button>
            <button onClick={() => setActiveType("mp3")}>
              <FaMusic size={20} />
              <span>MP3</span>
            </button>
            <button onClick={() => setActiveType("facebook")}>
              <FaFacebook size={20} />
              <span>Facebook</span>
            </button>
            <button onClick={() => setActiveType("wifi")}>
              <FaWifi size={20} />
              <span>WiFi</span>
            </button>
            <button onClick={() => setActiveType("appstore")}>
              <FaApple size={20} />
              <span>App Store</span>
            </button>
            <button onClick={() => setActiveType("vcard")}>
              <FaIdCard size={20} />
              <span>vCard</span>
            </button>
          </div>
          <div className="form">
            {activeType === "url" && (
              <>
                <h3>Enter URL</h3>
                <input
                  type="url"
                  placeholder="Enter URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </>
            )}
            {activeType === "message" && (
              <>
                <h3>Enter Message</h3>
                <textarea
                  placeholder="Enter your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                ></textarea>
              </>
            )}
            {activeType === "email" && (
              <>
                <h3>Enter Email Details</h3>
                <input
                  type="email"
                  placeholder="Recipient Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                ></textarea>
              </>
            )}
            {activeType === "pdf" && (
              <>
                <h3>Enter PDF Details</h3>

                {session ? (
                  <>
                    <div className="user-info">
                      <p>Logged in as: {session.user.email}</p>
                    </div>

                    <input
                      type="url"
                      placeholder="Enter PDF URL (Optional)"
                      value={pdfURL}
                      onChange={(e) => setPdfURL(e.target.value)}
                    />
                    <h4>Or Upload a PDF</h4>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                    />
                  </>
                ) : (
                  <div>
                    <h4>You need to sign in to upload a PDF</h4>
                    <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
                        Sign in with Google
                    </button>
                  </div>
                )}
              </>
            )}


            {activeType === "gallery" && (
              <>
                <h3>Upload Photos</h3>

                {session ? (
                  <>
                    <div className="user-info">
                      <p>Logged in as: {session.user.email}</p>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setGalleryFiles([...e.target.files])}
                    />
                    <div className="gallery-preview">
                      {galleryFiles.map((file, index) => (
                        <div key={index} className="image-container">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="gallery-image"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div>
                    <h4>You need to sign in to upload photos</h4>
                    <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
                      Sign in with Google
                    </button>
                  </div>
                )}
              </>
            )}


            {activeType === "twitter" && (
              <>
                <h3>Twitter Options</h3>
                <div className="twitter-options">
                  <button onClick={() => setTwitterOption("twitter-profile")}>
                    <FaTwitter size={20} />
                    <span>Profile</span>
                  </button>
                  <button onClick={() => setTwitterOption("twitter-tweet")}>
                    <FaTwitter size={20} />
                    <span>Tweet</span>
                  </button>
                </div>
                {twitterOption === "twitter-profile" && (
                  <>
                    <h3>Enter Twitter Handle</h3>
                    <input
                      type="text"
                      placeholder="e.g. yourhandle"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      required
                    />
                  </>
                )}
                {twitterOption === "twitter-tweet" && (
                  <>
                    <h3>Enter Tweet</h3>
                    <textarea
                      placeholder="Enter your tweet"
                      value={tweetText}
                      onChange={(e) => setTweetText(e.target.value)}
                      required
                    ></textarea>
                  </>
                )}
              </>
            )}
            {activeType === "bitcoin" && (
              <>
                <h3>Enter Bitcoin Payment Details</h3>
                <input
                  type="text"
                  placeholder="Cryptocurrency Type (e.g., Bitcoin, Ethereum)"
                  value={cryptoType}
                  onChange={(e) => setCryptoType(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Receiver (Name or Label)"
                  value={bitcoinReceiver}
                  onChange={(e) => setBitcoinReceiver(e.target.value)}
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Amount"
                  value={bitcoinAmount}
                  onChange={(e) => setBitcoinAmount(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Message (Optional)"
                  value={bitcoinMessage}
                  onChange={(e) => setBitcoinMessage(e.target.value)}
                ></textarea>
                <input
                  type="text"
                  placeholder="Address"
                  value={bitcoinAddress}
                  onChange={(e) => setBitcoinAddress(e.target.value)}
                  required
                />
              </>
            )}
            {activeType === "mp3" && (
              <>
                <h3>Upload MP3 File</h3>

                {session ? (
                  <>
                    <div className="user-info">
                      <p>Logged in as: {session.user.email}</p>
                    </div>

                    <input
                      type="file"
                      accept="audio/mpeg, audio/mp3"
                      onChange={(e) => setMp3File(e.target.files[0])}
                    />
                  </>
                ) : (
                  <div>
                    <h4>You need to sign in to upload MP3 files</h4>
                    <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
                      Sign in with Google
                    </button>
                  </div>
                )}
              </>
            )}

            {activeType === "facebook" && (
              <>
                <h3>Facebook Options</h3>
                <div className="facebook-options">
                  <button onClick={() => setFacebookOption("facebook-url")}>
                    <FaFacebook size={20} />
                    <span>URL</span>
                  </button>
                  <button onClick={() => setFacebookOption("facebook-post")}>
                    <FaFacebook size={20} />
                    <span>Post</span>
                  </button>
                </div>
                {facebookOption === "facebook-url" && (
                  <>
                    <h3>Enter Facebook URL</h3>
                    <input
                      type="url"
                      placeholder="Enter Facebook URL"
                      value={facebookURL}
                      onChange={(e) => setFacebookURL(e.target.value)}
                      required
                    />
                  </>
                )}
                {facebookOption === "facebook-post" && (
                  <>
                    <h3>Enter Your Post Text</h3>
                    <textarea
                      placeholder="Enter the text for your Facebook post"
                      value={facebookPostText}
                      onChange={(e) => setFacebookPostText(e.target.value)}
                      required
                    ></textarea>
                  </>
                )}
              </>
            )}
            {activeType === "wifi" && (
              <>
                <h3>WiFi Network Details</h3>
                <div
                  className="wifi-ssid-container"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <input
                    type="text"
                    placeholder="SSID"
                    value={wifiSSID}
                    onChange={(e) => setWifiSSID(e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                    />{" "}
                    Hidden
                  </label>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  required
                />
                <div className="wifi-encryption">
                  <label htmlFor="wifi-encryption">Encryption:</label>
                  <select
                    id="wifi-encryption"
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value)}
                    required
                  >
                    <option value="without">without</option>
                    <option value="WPA/WPA2">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                  </select>
                </div>
              </>
            )}
            {activeType === "appstore" && (
              <>
                <h3>Enter App Store URL</h3>
                <input
                  type="url"
                  placeholder="Enter App Store URL"
                  value={appStoreURL}
                  onChange={(e) => setAppStoreURL(e.target.value)}
                  required
                />
              </>
            )}
            {activeType === "vcard" && (
              <>
                <h3>vCard Details</h3>
                <input
                  type="text"
                  placeholder="First Name"
                  value={vcardFirstName}
                  onChange={(e) => setVcardFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={vcardLastName}
                  onChange={(e) => setVcardLastName(e.target.value)}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={vcardPhone}
                  onChange={(e) => setVcardPhone(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={vcardEmail}
                  onChange={(e) => setVcardEmail(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Organization (Optional)"
                  value={vcardOrganization}
                  onChange={(e) => setVcardOrganization(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Title (Optional)"
                  value={vcardTitle}
                  onChange={(e) => setVcardTitle(e.target.value)}
                />
              </>
            )}
            {activeType && (
              <button className="generate-button" onClick={handleGenerate}>
                Generate QR Code
              </button>
            )}
          </div>
        </div>
        <div className="qr-code-container">
          <h2>QR Code</h2>
          <div className="qr-code-display"style={{ position: 'relative' }}>
            {isGenerating && (
              <div style={overlayStyle}>
                <ClipLoader color="#4A90E2" size={40} />
              </div>
            )}
            {showSuccess && (
              <div style={successMessageStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                QR Code Generated Successfully
              </div>
            )}

          
            {qrCodePNG ? (
              <img
                src={qrCodePNG}
                alt="Generated QR Code"
                style={{
                  height: "auto",
                  objectFit: "contain",
                  width: "100%",
                  maxWidth: "300px",
                  aspectRatio: "1/1",
                  filter: isGenerating ? "blur(2px)" : "none",
                  transition: "filter 0.3s ease"
                }}
              />
              
            ) : (
              <div 
                className="placeholder" 
                style={{ opacity: isGenerating ? 0.5 : 1 }}
              >
                {isGenerating ? "Generating QR Code..." : "Your QR Code will appear here"}
              </div>
            )}

            
          </div>
          {qrCodePNG && !isGenerating && (
              <div className="download-buttons">
                <button onClick={handleDownloadPNG}>Download PNG</button>
              </div>
            )}
        </div>
      </div>
    </div>
    
  );
}


export default QRCodeForm;