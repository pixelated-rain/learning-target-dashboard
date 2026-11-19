export type LearningTarget = {
  id: string;
  name: string;
  prerequisites: string[];
  isCore?: boolean;
};
