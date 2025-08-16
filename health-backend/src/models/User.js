const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
		name: { type: String, trim: true },
		password: { type: String, required: true, minlength: 8 },
		role: { type: String, enum: ['user', 'admin'], default: 'user' }
	},
	{ timestamps: true }
);

userSchema.pre('save', async function onSave(next) {
	if (!this.isModified('password')) return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
	return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;