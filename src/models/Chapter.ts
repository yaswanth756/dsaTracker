import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
    title: string;
    emoji: string;
    order: number;
    bookId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
    {
        title: { type: String, required: true, trim: true },
        emoji: { type: String, default: '📑' },
        order: { type: Number, default: 0 },
        bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

ChapterSchema.index({ bookId: 1, order: 1 });

if (mongoose.models.Chapter) {
    delete mongoose.models.Chapter;
}

export default mongoose.model<IChapter>('Chapter', ChapterSchema);
