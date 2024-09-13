const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const winston = require('winston');

// 設定兩個設備的序列埠
const senderPort = new SerialPort({ path: '/dev/cu.usbserial-140', baudRate: 115200 }); // 發送端設備的序列埠
const receiverPort = new SerialPort({ path: '/dev/cu.usbserial-120', baudRate: 115200 }); // 接收端設備的序列埠

const senderParser = senderPort.pipe(new ReadlineParser({ delimiter: '\n' }));
const receiverParser = receiverPort.pipe(new ReadlineParser({ delimiter: '\n' }));

// 設定 winston 日誌記錄
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.File({ filename: 'message_log.log' }) // 儲存日誌到檔案
  ]
});

// 當前時間
let sendTime = 0;

// 發送訊息到發送端
function sendMessage() {
  sendTime = Date.now();
const message = `${sendTime.toString()}\n`; // Convert sendTime to string and send it as a message
  senderPort.write(message, (err) => {
    if (err) {
      console.error('發送失敗:', err.message);
      return;
    }
    console.log('發送時間：', sendTime);
  });
}

// 監聽來自發送端的序列訊息
senderParser.on('data', (data) => {
  console.log(`發送端序列埠的訊息: ${data}`);
});

// 從接收端接收訊息
receiverParser.on('data', (data) => {
  const receivedTime = Date.now(); // 接收當下的時間
  const senderTime = parseInt(data.trim(), 10); // 接收到的發送時間
  const delay = receivedTime - senderTime; // 計算延遲

  console.log(`發送時間: ${senderTime}, 接收時間: ${receivedTime}, 延遲: ${delay}ms`);

  // 將結果寫入日誌
  const logMessage = `發送時間: ${senderTime}, 接收時間: ${receivedTime}, 延遲: ${delay}ms`;
  logger.info(logMessage); // 使用 winston 記錄日誌
});

// 定期發送訊息
setInterval(sendMessage, 100); // 每100毫秒發送一次訊息
