import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/128/9131/9131529.png'
    },
    personalChats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalChat'
    }],
    groupChats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupChat'
    }],
});

const User = mongoose.model('User', userSchema);
export default User;