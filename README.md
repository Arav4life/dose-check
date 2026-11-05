# DoseCheck

DoseCheck is a free, local-first Expo mobile app that helps you remember whether you have already taken your daily supplements.

It is a simple check-in tool, not a medical device. Follow your product label or clinician's instructions. If you are unsure whether you took a dose, do not take an extra dose just because of the app; ask a pharmacist or clinician.

## Features

- Track multiple supplements with a name, dose label, and reminder time.
- Mark each supplement as **Taken** or undo the mark.
- Keep today's status separate from other calendar days.
- Save supplement details and dose history privately on the device.
- Optionally schedule daily local notifications.
- Continue using the tracker if notification permission is denied.
- No account, subscription, cloud sync, or paid features.

## Use it for free

DoseCheck is free and open source. The project does not require an account or paid service.

### Try it with Expo Go

1. Install [Expo Go](https://expo.dev/go) on your iPhone or Android phone.
2. Install Node.js, then clone this repository:

   ```bash
   git clone https://github.com/Arav4life/dose-check.git
   cd dose-check
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm start
   ```

5. Connect your phone and computer to the same Wi-Fi network.
6. Scan the QR code shown in the terminal with Expo Go (or the Camera app on iPhone).

The app runs locally on your device. Keep the terminal open while using it.

### Run in a simulator

If you have the required iOS Simulator or Android Emulator installed:

```bash
npm run ios
# or
npm run android
```

## How to use

1. Open DoseCheck.
2. Add a supplement name, the dose shown on its label, and a reminder time in `HH:MM` format.
3. When you take it, tap **Mark taken**.
4. If you tapped it by mistake, tap **Taken** to undo it.
5. Enable **Daily reminders** if you want local notifications.

The app only records what you mark. It cannot verify that a dose was taken and should not be used to change a dosage.

## Development

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npx expo-doctor
```

## Privacy

Supplement configuration, reminder settings, and dose status are stored locally on the device using AsyncStorage. This project does not include an account or remote database.

## License

This project is released under the MIT License. See [LICENSE](./LICENSE).
