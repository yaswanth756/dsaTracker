import mongoose, { Schema, Document } from 'mongoose';

export interface IPage extends Document {
    title: string;
    emoji: string;
    content: string;
    order: number;
    chapterId: mongoose.Types.ObjectId;
    bookId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
    {
        title: { type: String, required: true, trim: true, default: 'Untitled' },
        emoji: { type: String, default: '📄' },
        content: { type: String, default: '' },
        order: { type: Number, default: 0 },
        chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
        bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

PageSchema.index({ chapterId: 1, order: 1 });
PageSchema.index({ bookId: 1 });

if (mongoose.models.Page) {
    delete mongoose.models.Page;
}

export default mongoose.model<IPage>('Page', PageSchema);
