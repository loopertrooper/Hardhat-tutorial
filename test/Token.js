const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token contract", () => {
  let Token, token, owner, addr1, addr2;

  beforeEach(async () => {
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("My Solidity Token", "MST");
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("deployment", () => {
    it("Should set the rightfull owner", async () => {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async () => {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("transactions", async () => {
    it("should transfer tokens between accounts", async () => {
      await token.transfer(addr1.address, 50);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await token.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("should fail if sender doesn't have enough tokens", async () => {
      const initialBalanceOwner = await token.balanceOf(owner.address);

      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await token.balanceOf(owner.address)).to.equal(
        initialBalanceOwner
      );
    });

    it("should update balance after transfers", async () => {
      const initialBalanceOwner = await token.balanceOf(owner.address);
      await token.transfer(addr1.address, 100);
      await token.transfer(addr2.address, 100);

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(ethers.utils.formatEther(finalOwnerBalance)).to.equal(
        ethers.utils.formatEther(finalOwnerBalance)
      );

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await token.balanceOf(addr1.address);
      expect(addr2Balance).to.equal(100);
    });
  });
});
