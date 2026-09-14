import bcrypt from "bcrypt";
import { QueryFailedError } from "typeorm";

import { AuthService } from "../src/auth/auth.service.js";
import { DatabaseUnavailableError } from "../src/database/auth-data-source.js";
import { testEnvironment } from "./test-database.js";

describe("AuthService", () => {
  const configuration = {
    authentication: {
      jwtSecret: testEnvironment.JWT_SECRET,
      jwtExpiresInSeconds: Number(testEnvironment.JWT_EXPIRES_IN_SECONDS),
      bcryptCost: Number(testEnvironment.BCRYPT_COST),
    },
  };

  it("hashes a password before persisting an account", async () => {
    const repository = {
      create: jest.fn((user) => user),
      save: jest.fn(async (user) => user),
    };
    const dataSource = {
      get: jest.fn(async () => ({ getRepository: () => repository })),
    };
    const jwtService = { signAsync: jest.fn() };
    const service = new AuthService(
      dataSource as never,
      jwtService as never,
      configuration as never,
    );

    const account = await service.register({
      email: "persona@example.test",
      password: "password",
    });

    expect(account.email).toBe("persona@example.test");
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "persona@example.test",
        id: expect.any(String),
        passwordHash: expect.not.stringContaining("password"),
      }),
    );
    const storedUser = repository.save.mock.calls[0]?.[0] as
      | { passwordHash: string }
      | undefined;
    expect(storedUser).toBeDefined();
    if (!storedUser) {
      throw new Error("Expected a persisted user");
    }

    await expect(bcrypt.compare("password", storedUser.passwordHash)).resolves.toBe(true);
  });

  it("emits a token only after the password comparison succeeds", async () => {
    const passwordHash = await bcrypt.hash("password", 4);
    const query = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: "32874025-f1b8-4650-8b9f-e59ff4b72175",
        email: "persona@example.test",
        passwordHash,
      }),
    };
    const dataSource = {
      get: jest.fn(async () => ({ getRepository: () => ({ createQueryBuilder: () => query }) })),
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue("signed-token") };
    const service = new AuthService(
      dataSource as never,
      jwtService as never,
      configuration as never,
    );

    await expect(
      service.login({ email: "persona@example.test", password: "password" }),
    ).resolves.toEqual({ accessToken: "signed-token" });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: "32874025-f1b8-4650-8b9f-e59ff4b72175",
    });
  });

  it("maps unavailable and query errors to safe public errors", async () => {
    const service = new AuthService(
      {
        get: jest
          .fn()
          .mockRejectedValueOnce(new DatabaseUnavailableError())
          .mockRejectedValueOnce(new QueryFailedError("SELECT 1", [], new Error("offline"))),
      } as never,
      { signAsync: jest.fn() } as never,
      configuration as never,
    );

    await expect(
      service.login({ email: "persona@example.test", password: "password" }),
    ).rejects.toMatchObject({ response: { message: "Authentication service unavailable" } });
    await expect(
      service.login({ email: "persona@example.test", password: "password" }),
    ).rejects.toMatchObject({ response: { message: "Authentication service unavailable" } });
  });
});
