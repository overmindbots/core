if (!process.env.PORT) {
  throw new Error('Missing env variable PORT');
}

export const PORT = process.env.PORT;
