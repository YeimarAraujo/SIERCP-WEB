import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snaps = await adminDb.collection('platform_enrollments').get();
    let count = 0;
    
    for (const doc of snaps.docs) {
      const data = doc.data();
      if (!data.templateId && data.courseSlug) {
        const tSnap = await adminDb.collection('course_templates').where('slug', '==', data.courseSlug).limit(1).get();
        if (!tSnap.empty) {
          await doc.ref.update({ templateId: tSnap.docs[0].id });
          count++;
        }
      }
    }
    return NextResponse.json({ message: `Updated ${count} enrollments` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
