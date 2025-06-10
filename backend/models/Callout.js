const mongoose = require('mongoose');

const calloutSchema = new mongoose.Schema({
  roomId: String,
  classification: String,
  asset: String,
  sensor: String,
  operation: String,
  countryCode: String,
  team: String,
  zulu: String,
  mgrs: String,
  location: String,
  activity: String,
  males: Number,
  females: Number,
  children: Number,
  iaNotes: String,
  follow: {
    name: String,
    stage: String
  },
  qc: { type: String, default: "qc-orange" },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  editedAt: Date,
  history: [
    {
      editedBy: String,
      editedAt: Date,
      changes: Object
    }
  ]
});

module.exports = mongoose.model('Callout', calloutSchema);