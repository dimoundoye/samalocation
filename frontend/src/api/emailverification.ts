import axios from 'axios';

const CLEAROUT_API_KEY = "TA_CLE_API"; // remplace par ta clé

export async function verifyEmail(email) {
  try {
    const response = await axios.get("https://api.clearout.io/v2/email_verify/instant", {
      params: {
        email: email,
        api_key: CLEAROUT_API_KEY
      }
    });

    const result = response.data;
    console.log("Résultat :", result);

    if (result.status === "valid") {
      console.log("✅ Email valide et utilisable");
      return true;
    } else {
      console.log("❌ Email invalide ou risqué :", result.reason);
    }
  } catch (error) {
    console.error("Erreur API Clearout :", error.message);
  }
}

