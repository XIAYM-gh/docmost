# Docmost (forked)

A derivative of [Docmost](https://github.com/docmost/docmost), trying keeping it clean and simple.

> [!WARNING]
> This is a personal fork with learning and educational purpose, please consider buying an EE license to support the original authors.
>
> Also, frequent updates are not guaranteed because of very limited time.
>
> Bugs may arise, please report them through GitHub issues.

## Features

From upstream:

- Real-time collaboration
- Diagrams (Draw.io, Excalidraw and Mermaid)
- Spaces
- Permissions management
- Groups
- Comments
- Page history
- Search
- File attachments
- Embeds (Airtable, Loom, Miro and more)

Our modifications:

- Basic MFA feature (TOTP only)
- Resolving comments
- Clean up useless cloud modules and enterprise edition features, including telemetry
- We don't need AI

> API Keys feature is working in progress.

## Getting Started

### Requirements

- NodeJS runtime
- Valid `pnpm` installation
- PostgreSQL server (Permission Setup Required)
- Redis/Valkey server

### Building & Running

`pnpm` is used to manage dependencies and build the project. Please follow the instructions below to compile it.

```shell
# Clone this repository first
git clone https://github.com/XIAYM-gh/docmost
cd docmost

# Then install dependencies
pnpm i

# Build the entire project (skip this if you want to run Docmost in development mode)
pnpm build
```

> [!NOTE]
> Please reinstall the dependencies every time after running `git pull` to avoid potential issues.  
> If problems still exist after reinstalling, please remove every `node_modules` folder and retry.

After compiling the project, you need to configure the dotenv file, of which you can refer to [the official documentation](https://docmost.com/docs/self-hosting/environment-variables) for help.

```shell
cp .env.example .env

# Then edit the .env file, e.g. using vim
vim .env
```

Now please ensure PosgreSQL and Redis (or Valkey) is running. Eventually you can run the server as follows.

```shell
# Running in production mode (recommended)
pnpm run server:start

# Or in development mode, which provides more debug information
pnpm nx run server:start

# Additionally, you can run it in watch mode
pnpm nx run @docmost/editor-ext:build
pnpm nx run client:dev
pnpm nx run server:start:dev
```

> [!NOTE]
> If you encounter problems running the dev server, please apply the migrations first using:  
> `pnpm nx run server:migration:latest`

> [!TIP]
> People may find NodeJS throwing errors when running within a proot container.  
> If so, please start the server using `node launch-proot.js` instead.

## License

Docmost core is licensed under the open-source AGPL 3.0 license. Please refer to the upstream repository for more details.

## Acknowledgement

Thanks the original Docmost team for their valuable contributions!
