import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
    title: string;
    description: string;
    emoji: string;
    coverGradient: string;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        emoji: { type: String, default: '📘' },
        coverGradient: {
            type: String,
            default: 'from-violet-500 to-purple-600',
        },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

BookSchema.index({ userId: 1, updatedAt: -1 });

if (mongoose.models.Book) {
    delete mongoose.models.Book;
}

export default mongoose.model<IBook>('Book', BookSchema);
