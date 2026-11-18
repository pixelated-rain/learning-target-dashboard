{
  description = "A development environment for the learning target dashboard.";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = {nixpkgs, ...}: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      packages = with pkgs; [
        nodejs_24
        python313
        uv
        git
        lazygit
      ];

      UV_PYTHON_DOWNLOADS = "never";

      shellHook = ''
        echo ""
        echo "Learning Target Dashboard Development Environment"
        echo ""
        echo "Node:   $(node --version)"
        echo "Python: $(python --version)"
        echo "UV: $(uv --version)"
        echo "NPM: $(npm --version)"
        echo ""
      '';
    };
  };
}
