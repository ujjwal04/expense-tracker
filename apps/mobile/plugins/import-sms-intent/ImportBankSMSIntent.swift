import AppIntents
import Foundation

/// Shows up in the Shortcuts app as "Import Bank SMS". A Message automation passes each bank SMS here.
/// It runs in the background without opening the app and only appends the raw text to an inbox file;
/// the app's TypeScript code parses, dedups and stores it the next time the app is opened.
struct ImportBankSMSIntent: AppIntent {
  static var title: LocalizedStringResource = "Import Bank SMS"
  static var description = IntentDescription("Sends a bank SMS to Expense Tracker so the transaction is recorded.")
  static var openAppWhenRun: Bool = false

  @Parameter(title: "Message")
  var message: String

  func perform() async throws -> some IntentResult {
    try SmsInbox.append(message)
    return .result()
  }
}

/// One JSON object per line in Documents/sms-inbox.jsonl. Read by src/ingest/inbox.ts.
enum SmsInbox {
  static let fileName = "sms-inbox.jsonl"

  static func append(_ body: String) throws {
    let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let url = documents.appendingPathComponent(fileName)
    let entry: [String: String] = ["body": body, "receivedAt": ISO8601DateFormatter().string(from: Date())]
    var line = try JSONSerialization.data(withJSONObject: entry)
    line.append(0x0A)

    if FileManager.default.fileExists(atPath: url.path) {
      let handle = try FileHandle(forWritingTo: url)
      defer { try? handle.close() }
      try handle.seekToEnd()
      try handle.write(contentsOf: line)
    } else {
      try line.write(to: url, options: .atomic)
    }
  }
}
