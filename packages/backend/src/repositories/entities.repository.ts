import { UserEntity } from "#backend/entities/index.js";
import { BaseRepository } from "@david-tobi-peter/foundation";

class UserRepositoryClass extends BaseRepository<UserEntity> {
  constructor() {
    super(UserEntity);
  }
}
export const userRepository = new UserRepositoryClass();
