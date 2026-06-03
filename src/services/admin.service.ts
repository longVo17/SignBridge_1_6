import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { LearningPath, Lesson, QuizQuestion } from '../types/data.types';

export const adminService = {
  /**
   * Adds a new learning path (unit) to Firestore.
   * Path ID is auto-generated.
   */
  addLearningUnit: async (unit: Omit<LearningPath, 'id' | 'lessonCount'>): Promise<string> => {
    try {
      const pathsColRef = collection(db, 'learningPaths');
      const docRef = doc(pathsColRef);
      const newPath: any = {
        id: docRef.id,
        title: unit.title,
        description: unit.description,
        icon: unit.icon,
        order: Number(unit.order),
        totalXP: Number(unit.totalXP),
        lessonCount: 0,
        createdAt: serverTimestamp(),
      };
      await setDoc(docRef, newPath);
      return docRef.id;
    } catch (error) {
      console.error('Error adding learning unit:', error);
      throw error;
    }
  },

  /**
   * Adds a new lesson to a learning path subcollection,
   * then increments the lessonCount on the parent learning path doc.
   */
  addLessonToUnit: async (lesson: Omit<Lesson, 'id'>): Promise<string> => {
    try {
      const lessonsColRef = collection(db, 'learningPaths', lesson.pathId, 'lessons');
      const docRef = doc(lessonsColRef);
      const newLesson: Lesson = {
        id: docRef.id,
        pathId: lesson.pathId,
        title: lesson.title,
        signId: lesson.signId,
        order: Number(lesson.order),
        xpReward: Number(lesson.xpReward),
        type: lesson.type,
      };
      
      // Save the subcollection document
      await setDoc(docRef, newLesson);
      
      // Increment lessonCount on the parent path document
      const parentRef = doc(db, 'learningPaths', lesson.pathId);
      await updateDoc(parentRef, {
        lessonCount: increment(1)
      });
      
      return docRef.id;
    } catch (error) {
      console.error(`Error adding lesson to path ${lesson.pathId}:`, error);
      throw error;
    }
  },

  /**
   * Saves or overwrites a quiz document at /learningPaths/{pathId}/quizzes/main
   */
  addQuizToUnit: async (
    pathId: string,
    passingScore: number,
    questions: QuizQuestion[]
  ): Promise<void> => {
    try {
      const quizDocRef = doc(db, 'learningPaths', pathId, 'quizzes', 'main');
      await setDoc(quizDocRef, {
        id: 'main',
        pathId,
        passingScore: Number(passingScore),
        questions,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error saving quiz for path ${pathId}:`, error);
      throw error;
    }
  }
};
