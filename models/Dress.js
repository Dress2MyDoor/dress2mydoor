import mongoose from 'mongoose';

const dressSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['wedding', 'casual', 'evening', 'cocktail', 'party', 'prom'],
        required: true
    },
    sizes: {
        type: [String],
        enum: ['xs', 's', 'm', 'l', 'xl'],
        required: true
    },
    colour: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Dress', dressSchema);
