import { UserEntity } from "#/infra/database/postgres/entities";
import { BaseRepository } from "./base.repository.js";
import { AppDataSource } from "#/infra/database/postgres/config";

class UserRepositoryClass extends BaseRepository<UserEntity> {
  constructor() {
    const repository = AppDataSource.getRepository(UserEntity);
    super(repository.target, repository.manager);
  }
}
export const userRepository = new UserRepositoryClass();
