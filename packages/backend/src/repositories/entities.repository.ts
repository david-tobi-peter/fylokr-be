import { UserEntity } from "#backend/entities/index.js";
import { BaseRepository, getAppDataSource } from "@david-tobi-peter/foundation";

class UserRepositoryClass extends BaseRepository<UserEntity> {
  constructor() {
    const dataSource = getAppDataSource();
    const repository = dataSource.getRepository(UserEntity);
    super(repository.target, repository.manager);
  }
}
export const userRepository = new UserRepositoryClass();
