# How to Build & Download your `Locus.ipa` with GitHub Actions (No Mac Needed)

Because you do not own a Mac, you can use **GitHub's free macOS cloud servers** to compile Xcode and generate your `.ipa` file.

---

### Step 1: Put this code onto GitHub
1. Go to [github.com](https://github.com) and create a free account (if you don't already have one).
2. Click **New Repository**, name it `locus-ios`, choose **Private** (or Public), and click **Create repository**.
3. Push or upload this project code to your new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Add Locus GPS and iOS build pipeline"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/locus-ios.git
   git push -u origin main
   ```
   *(Or you can download the project zip from the AI Studio header and drag-and-drop the files directly on GitHub).*

---

### Step 2: Run the Build on GitHub
1. In your GitHub repository, click the **Actions** tab at the top.
2. In the left sidebar, click **Build iOS IPA**.
3. Click the **Run workflow** dropdown on the right side and click the green **Run workflow** button.
4. GitHub will boot up a real Apple Silicon Mac in the cloud, run Xcode, compile the native code, and create `Locus.ipa`.
5. Once the build finishes (takes ~2 to 4 minutes and turns green with a checkmark):
   - Click on the completed run (e.g. *"Build & Package .IPA"*).
   - Scroll down to the **Artifacts** section at the bottom.
   - Click **`Locus-iOS-IPA`** to download your ready-to-use `.ipa` file!

---

### Step 3: Install the `.ipa` on your iPhone (Windows PC or directly on iOS)

You have 3 easy ways to install this `.ipa` onto your iPhone:

#### Option 1: Sideloadly (Easiest if using a Windows PC)
1. Download **Sideloadly** (Free for Windows & Mac) from [sideloadly.io](https://sideloadly.io).
2. Connect your iPhone to your PC with a USB cable.
3. Drag and drop your downloaded `Locus.ipa` into Sideloadly.
4. Enter your Apple ID email (used to sign the app with Apple's free developer certificate).
5. Click **Start**. In 30 seconds, Locus will appear on your iPhone home screen!
6. On your iPhone: Go to **Settings > General > VPN & Device Management**, tap your Apple ID, and tap **Trust**.

#### Option 2: SideStore / AltStore (Directly on iPhone without cables)
1. If you already have **SideStore** or **AltStore** installed on your phone:
2. Send `Locus.ipa` to your phone via Google Drive, iCloud Drive, or Telegram.
3. Open AltStore/SideStore → tap **`+`** (Install) → choose `Locus.ipa`.

#### Option 3: TrollStore (If your device is compatible)
1. AirDrop or download `Locus.ipa` in Safari.
2. Tap Share → **Open in TrollStore**.
3. It installs permanently with no 7-day expiration and full root location permissions!
