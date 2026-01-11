import { UserEntity } from "#/postgres/entities";
import { BaseRepository } from "./base.repository.js";
import { AppDataSource } from "#/postgres/config";

class UserRepositoryClass extends BaseRepository<UserEntity> {
  constructor() {
    const repository = AppDataSource.getRepository(UserEntity);
    super(repository.target, repository.manager);
  }
}
export const userRepository = new UserRepositoryClass();
