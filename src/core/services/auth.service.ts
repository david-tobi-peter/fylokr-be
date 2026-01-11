import { Service } from "typedi";
import bcrypt from "bcrypt";
import { userRepository } from "#/postgres/repositories";
import type { SignUpRequestType, SignUpResponseType } from "#/shared/types/api";
import { InternalServerError, ResourceConflictError } from "#/errors";

@Service()
export class AuthService {
  constructor() {}

  async signUp(data: SignUpRequestType): Promise<SignUpResponseType> {
    const userExists = await userRepository.findOne({
      where: { username: data.username },
      withDeleted: true,
    });

    if (userExists) {
      throw new ResourceConflictError("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await userRepository.createRecord({
      username: data.username,
      password: hashedPassword,
      ...(data.email && { email: data.email }),
      ...(data.recoveryCodes && { recoveryCodes: data.recoveryCodes }),
    });

    if (newUser) {
      return {
        data: {
          token: "dummy token",
        },
      };
    }

    throw new InternalServerError(
      "Could not complete sign up. Please try again",
    );
  }
}
