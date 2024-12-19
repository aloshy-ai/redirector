{
  description = "Edge function middleware for dynamic DNS-based redirects with TXT record configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            yarn
            gh
          ];

          shellHook = ''
            if [ ! -d "node_modules" ]; then
              echo "Installing dependencies..."
              yarn install
            fi
          '';
        };
      }
    );
}
