import crypto from "crypto";

let cachedPublicKey: string | null = null;

/**
 * Fetches the Circle public key for encrypting entity secrets
 */
export async function getCirclePublicKey(apiKey: string): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;

  const res = await fetch("https://api.circle.com/v1/w3s/config/entity/publicKey", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch Circle entity public key: ${text}`);
  }

  const json = await res.json();
  const publicKey = json.data?.publicKey;
  if (!publicKey) {
    throw new Error("Circle public key response did not contain publicKey");
  }

  cachedPublicKey = publicKey;
  return publicKey;
}

/**
 * Encrypts the raw 32-byte hex entity secret using Circle's public key
 */
export async function getEntitySecretCipher(apiKey: string, entitySecretHex: string): Promise<string> {
  const publicKeyPem = await getCirclePublicKey(apiKey);
  const buffer = Buffer.from(entitySecretHex, "hex");
  
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );

  return encrypted.toString("base64");
}

export interface CircleWalletConfig {
  apiKey: string;
  walletSetId: string;
  entitySecretCipher: string;
  address: string | null;
  walletId: string | null;
}

let cachedConfig: CircleWalletConfig | null = null;

/**
 * Automatically bootstraps and retrieves the Circle Developer configuration.
 * Encrypts the entity secret, finds or creates a wallet set, and finds or creates an Arc Testnet EOA wallet.
 */
export async function bootstrapCircleDeveloperClient(): Promise<CircleWalletConfig | null> {
  if (cachedConfig) return cachedConfig;

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey) {
    console.log("[Circle SDK Auto-Bootstrap] No CIRCLE_API_KEY set. Operating in simulation mode.");
    return null;
  }

  try {
    // 1. Generate ciphertext
    let entitySecretCipher = process.env.CIRCLE_ENTITY_SECRET_CIPHER;
    if (!entitySecretCipher) {
      if (!entitySecret) {
        console.warn("[Circle SDK Auto-Bootstrap] CIRCLE_API_KEY is present but both CIRCLE_ENTITY_SECRET and CIRCLE_ENTITY_SECRET_CIPHER are missing.");
        return null;
      }
      entitySecretCipher = await getEntitySecretCipher(apiKey, entitySecret);
    }

    // 2. Resolve Wallet Set
    let walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    if (!walletSetId) {
      console.log("[Circle SDK Auto-Bootstrap] CIRCLE_WALLET_SET_ID not defined. Querying existing wallet sets...");
      const walletSetsRes = await fetch("https://api.circle.com/v1/w3s/developer/walletSets", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (walletSetsRes.ok) {
        const wsData = await walletSetsRes.json();
        const sets = wsData.data?.walletSets || [];
        if (sets.length > 0) {
          walletSetId = sets[0].id;
          console.log(`[Circle SDK Auto-Bootstrap] Found existing Wallet Set: ${walletSetId}`);
        }
      }

      // If no wallet set found, create one
      if (!walletSetId) {
        console.log("[Circle SDK Auto-Bootstrap] No wallet sets found. Creating a new wallet set...");
        const createWsRes = await fetch("https://api.circle.com/v1/w3s/developer/walletSets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            name: "CashFlow360 Wallet Set",
            entitySecretCiphertext: entitySecretCipher,
          }),
        });

        if (!createWsRes.ok) {
          const text = await createWsRes.text();
          throw new Error(`Failed to create wallet set: ${text}`);
        }

        const wsResult = await createWsRes.json();
        walletSetId = wsResult.data?.walletSet?.id;
        console.log(`[Circle SDK Auto-Bootstrap] Created new Wallet Set: ${walletSetId}`);
      }
    }

    if (!walletSetId) {
      throw new Error("Unable to resolve Circle Wallet Set ID");
    }

    // 3. Ensure a wallet exists on Arc Testnet
    const walletsRes = await fetch(`https://api.circle.com/v1/w3s/developer/wallets?walletSetId=${walletSetId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    let arcWallet = null;
    if (walletsRes.ok) {
      const walletsData = await walletsRes.json();
      const wallets = walletsData.data?.wallets || [];
      arcWallet = wallets.find((w: any) => w.blockchain === "arc-testnet" && w.state === "LIVE");
      if (arcWallet) {
        console.log(`[Circle SDK Auto-Bootstrap] Resolved existing Arc Testnet Developer EOA Wallet: ${arcWallet.address}`);
      }
    }

    if (!arcWallet) {
      console.log(`[Circle SDK Auto-Bootstrap] Creating new Arc Testnet EOA Wallet in Wallet Set ${walletSetId}...`);
      const createWalletRes = await fetch("https://api.circle.com/v1/w3s/developer/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          walletSetId: walletSetId,
          blockchains: ["arc-testnet"],
          count: 1,
          walletType: "EOA",
          entitySecretCiphertext: entitySecretCipher,
        }),
      });

      if (!createWalletRes.ok) {
        const text = await createWalletRes.text();
        throw new Error(`Failed to create developer wallet: ${text}`);
      }

      const walletResult = await createWalletRes.json();
      const createdWallets = walletResult.data?.wallets || [];
      if (createdWallets.length > 0) {
        arcWallet = createdWallets[0];
        console.log(`[Circle SDK Auto-Bootstrap] Created EOA Wallet: ${arcWallet.address} (ID: ${arcWallet.id})`);
      } else {
        throw new Error("Create wallet response did not return any wallets");
      }
    }

    cachedConfig = {
      apiKey,
      walletSetId,
      entitySecretCipher,
      address: arcWallet?.address || null,
      walletId: arcWallet?.id || null,
    };
    return cachedConfig;
  } catch (err: any) {
    console.error("[Circle SDK Auto-Bootstrap] Error during bootstrap:", err.message);
    return null;
  }
}
