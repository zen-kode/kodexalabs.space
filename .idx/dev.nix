# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.nodePackages.pnpm
    pkgs.python3
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "bradlc.vscode-tailwindcss"
      "ms-vscode.vscode-typescript-next"
      "esbenp.prettier-vscode"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {};
    };

    # Workspace lifecycle hooks
    workspace = {
      onCreate = {};
      onStart = {};
    };
  };
}
