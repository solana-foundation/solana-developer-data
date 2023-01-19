# solana-developer-data

Goal: Collecting Solana Developer Data from Github

This repository is an example crawler that searches for Solana related activity on Github and collects them into a postgres db.

The crawler uses the following to find Solana repositories:

| Library         | Query                                     | Description                  |
|-----------------|-------------------------------------------|------------------------------|
| @solana/web3.js | solana/web3.js filename:package.json      | Solana JS/TS SDK             |
| @solana/web3.js | solana/web3.js filename:package-lock.json | Solana JS/TS SDK             |
| @solana/web3.js | solana/web3.js filename:yarn.lock         | Solana JS/TS SDK             |
| serum/anchor    | serum/anchor filename:package.json        | Anchor JS/TS SDK             |
| solana-program  | solana-program filename:Cargo.toml        | Solana Rust Program SDK      |
| anchor-lang     | anchor-lang filename:Cargo.toml           | Anchor Framework Program SDK |
| Solnet          | Solnet.Rpc filename:*.csproj              | Solana C# SDK                |
| solana-go       | gagliardetto/solana filename:mod.go       | Solana Go SDK                |
| solana          | "from solana rpc import" language:python  | Solana Python SDK            |

## How to Run Locally

1. Go into the `/local` folder and run `docker compose up` to start a docker container with a postgres db
```bash
cd local
docker compose up
```
2. Get a [Github access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) and place in the `.env` file under `GITHUB_ACCESS_TOKEN`
2. Run `npm install`
3. Run `npm run start`
