{
  description = "Arffornia Launcher: nix run github:Arffornia/Arffornia_Launcher_V.5.2";

  # Official channel tarball (same content as github:NixOS/nixpkgs/nixos-26.05); `nix flake update` bumps it.
  inputs.nixpkgs.url = "https://channels.nixos.org/nixos-26.05/nixexprs.tar.xz";

  outputs =
    { self, nixpkgs }:
    let
      # Only x86_64 Linux AppImages are released today.
      systems = [ "x86_64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      packages = forAll (pkgs: rec {
        arffornia-launcher = pkgs.callPackage ./nix/package.nix { };
        default = arffornia-launcher;
      });

      apps = forAll (pkgs: {
        default = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.default}/bin/arffornia-launcher";
        };
      });

      overlays.default = final: _prev: {
        arffornia-launcher = final.callPackage ./nix/package.nix { };
      };
    };
}
