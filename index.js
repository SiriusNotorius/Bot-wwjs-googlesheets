const { google } = require("googleapis");
require("dotenv").config();
const qrcode = require("qrcode-terminal");

const { Client, LocalAuth } = require("whatsapp-web.js");
const client = new Client({
  authStrategy: new LocalAuth(),
});

const country_code = 549;

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Client is ready!");

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const clientGoogle = await auth.getClient();
  const googleSheet = google.sheets({ version: "v4", auth: clientGoogle });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const getMetaData = await googleSheet.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Temp!A2:B",
  });

  const dataArray = getMetaData.data.values;

  console.log(dataArray);

  const tempData = [];

  for (let i = 0; i < dataArray.length; i++) {
    let number = Number(dataArray[i][0]);
    let msg = dataArray[i][1];
    console.log(dataArray[i][0]);

    let chatId = number + "@c.us";

    const isRegistered = await client.isRegisteredUser(chatId);

    console.log(isRegistered);

    if (!isRegistered) {
      console.log("User is not registered");
      tempData.push([number, msg, "Error, mensaje no enviado"]);
    } else {
      await client.sendMessage(chatId, msg).then((response) => {
        if (response.id.fromMe) {
          console.log(number + " recibio tu mensaje");
          tempData.push([number, msg, "Mensaje enviado"]);
        }
      });
    }
  }
  console.log(tempData);

  const clearData = await googleSheet.spreadsheets.values.clear({
    auth,
    spreadsheetId,
    range: "Temp!A2:C",
  });

  const postSearchedVal = await googleSheet.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: "Temp",
    valueInputOption: "USER_ENTERED",
    resource: { values: tempData },
  });
});

client.initialize();
