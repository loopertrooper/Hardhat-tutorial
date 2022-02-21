const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC721 Token", () => {
  let Token, token, owner, addr1, addr2, addr3, zeroAddress;

  beforeEach(async () => {
    Token = await ethers.getContractFactory("ERC721");
    token = await Token.deploy("My Solidity Token", "MST");
    [owner, addr1, addr2, addr3, _] = await ethers.getSigners();
    zeroAddress = "0x0000000000000000000000000000000000000000";
  });

  describe("deployment", () => {
    it("should return correct name and symbol", async () => {
      const tokenName = await token._name();
      expect(tokenName).to.equal("My Solidity Token");

      const tokenSymbol = await token._symbol();
      expect(tokenSymbol).to.equal("MST");
    });
  });

  describe("mint", async () => {
    it("should mint token to the given account", async () => {
      let addr1Balance = await token.balanceOf(addr1.address);
      await token["safeMint(address,uint256)"](addr1.address, 1);

      addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(1);

      const tokenOwner = await token.ownerOf(1);
      expect(tokenOwner).to.equal(addr1.address);
    });

    it("should not mint if to address is zero address or token already exists", async () => {
      await expect(
        token["safeMint(address,uint256)"](zeroAddress, 1)
      ).to.be.revertedWith("ERC721 - to is zero address");

      await token["safeMint(address,uint256)"](addr1.address, 1);

      await expect(
        token["safeMint(address,uint256)"](addr2.address, 1)
      ).to.be.revertedWith("ERC721 - tokenId already exists");
    });
  });

  describe("burn", async () => {
    it("should burn token and remove approval", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      let addr1Balance = await token.balanceOf(addr1.address);

      await token._burn(1);
      await expect(token.ownerOf(1)).to.be.revertedWith(
        "ERC721 - owner query for token that does not exist"
      );

      addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(0);

      await expect(token.getApproved(1)).to.be.revertedWith(
        "ERC721 - approved account query for token that does not exists"
      );
    });
  });

  describe("approve", async () => {
    it("only owner or approved operator should be able to call approve", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      const owner = addr1;

      await token.connect(owner).setApprovalForAll(addr2.address, true);
      const operator = addr2;

      const toBeApproved = addr3;
      await expect(token.approve(toBeApproved.address, 1)).to.be.revertedWith(
        "ERC721 - Sender is not owner or operator"
      );

      await token.connect(owner).approve(toBeApproved.address, 1);
      await expect(await token.getApproved(1)).to.equal(toBeApproved.address);

      await token.connect(owner).approve(zeroAddress, 1);

      await token.connect(operator).approve(toBeApproved.address, 1);
      await expect(await token.getApproved(1)).to.equal(toBeApproved.address);
    });

    it("owner cannot be approved", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      const owner = addr1;
      await expect(
        token.connect(owner).approve(owner.address, 1)
      ).to.be.revertedWith("ERC721 - giving token approval to owner");
    });

    it("approved account should be able to transfer", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      const owner = addr1;

      await token.connect(owner).approve(addr2.address, 1);
      const approved = addr2;

      await token
        .connect(approved)
        ["safeTransferFrom(address,address,uint256)"](
          owner.address,
          addr3.address,
          1
        );
    });
  });

  describe("approval for all", async () => {
    it("given operator is approved", async () => {
      await token.connect(addr1).setApprovalForAll(addr2.address, true);
      await expect(
        await token.isApprovedForAll(addr1.address, addr2.address)
      ).to.equal(true);
    });

    it("operator should be able to transfer", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      const owner = addr1;

      await token.connect(owner).setApprovalForAll(addr2.address, true);
      const operator = addr2;

      await token
        .connect(operator)
        ["safeTransferFrom(address,address,uint256)"](
          owner.address,
          addr3.address,
          1
        );
    });

    it("operator cannot be owner", async () => {
      await expect(
        token.connect(addr1).setApprovalForAll(addr1.address, true)
      ).to.be.revertedWith("ERC721 - operator is owner");
    });
  });

  describe("transferFrom", async () => {
    it("owner changes after transfer token and approvals revoked", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      const owner = addr1;

      await token
        .connect(owner)
        ["safeTransferFrom(address,address,uint256)"](
          owner.address,
          addr2.address,
          1
        );
      const newOwner = addr2;
      ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(0);

      newOwnerBalance = await token.balanceOf(newOwner.address);
      expect(newOwnerBalance).to.equal(1);

      await expect(await token.ownerOf(1)).to.equal(newOwner.address);

      await expect(await token.getApproved(1)).to.equal(zeroAddress);
    });

    it("only owner or approved operator should be able to transfer token", async () => {
      await token["safeMint(address,uint256)"](addr1.address, 1);
      const owner = addr1;

      await expect(
        token["safeTransferFrom(address,address,uint256)"](
          owner.address,
          addr2.address,
          1
        )
      ).to.be.revertedWith(
        "ERC721 - sender is not owner, approved or operator"
      );
    });

    it("operator cannot be owner", async () => {
      await expect(
        token.connect(addr1).setApprovalForAll(addr1.address, true)
      ).to.be.revertedWith("ERC721 - operator is owner");
    });
  });
});
