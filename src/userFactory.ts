import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export function createUser(): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: faker.date.recent(),
  };
}

export function createUsers(n: number): User[] {
  return Array.from({ length: n }, createUser);
}
