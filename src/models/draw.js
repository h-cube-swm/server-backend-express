const mongoose = require("mongoose");

// Define Schemes
// 해당 테이블이 생성된 것 자체가 draw 기능을 사용한다는 것을 의미한다.
const drawSchema = mongoose.Schema(
  {
    id: String, // survey id
    isEnabled: { type: Boolean, default: false },
    number: Number,
    drawResult: Array,
  },
  { strict: false, timestamps: true }
);

// Create Model
const draw = mongoose.model("Draw", drawSchema);

module.exports = draw;
