const mongoose = require("mongoose");
const { mailSender } = require("../util/mailSender");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300,
    },
})

otpSchema.pre("save", async function(next) {
    if(this.isNew) {
        await mailSender(
            this.email,
            `OTP: ${this.otp}`
        )
    }
})

module.exports = mongoose.model("OTP", otpSchema);