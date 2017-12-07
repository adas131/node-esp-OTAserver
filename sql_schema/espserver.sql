-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Dec 07, 2017 at 04:39 PM
-- Server version: 5.7.20-0ubuntu0.16.04.1
-- PHP Version: 7.0.22-0ubuntu0.16.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `espserver`
--

-- --------------------------------------------------------

--
-- Table structure for table `chiptypes`
--

CREATE TABLE `chiptypes` (
  `id_chiptypes` int(11) NOT NULL,
  `description` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `espchips`
--

CREATE TABLE `espchips` (
  `id_espchips` int(11) NOT NULL,
  `chip_id` varchar(45) NOT NULL,
  `lastrequest` bigint(14) NOT NULL,
  `lastupdate` bigint(14) DEFAULT NULL,
  `lastversion` char(32) DEFAULT NULL,
  `allowedversion` char(32) DEFAULT NULL,
  `chiptype` int(11) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `firmwareversions`
--

CREATE TABLE `firmwareversions` (
  `id_firmwareversions` int(11) NOT NULL,
  `md5` char(32) NOT NULL,
  `data` longblob,
  `description` varchar(512) DEFAULT NULL,
  `chiptype` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chiptypes`
--
ALTER TABLE `chiptypes`
  ADD PRIMARY KEY (`id_chiptypes`);

--
-- Indexes for table `espchips`
--
ALTER TABLE `espchips`
  ADD PRIMARY KEY (`id_espchips`),
  ADD UNIQUE KEY `chip_id_UNIQUE` (`chip_id`),
  ADD UNIQUE KEY `id_espchips_UNIQUE` (`id_espchips`),
  ADD KEY `fk_firmwareversions_lastversion_idx` (`lastversion`),
  ADD KEY `fk_firmwareversionsallowedversion_idx` (`allowedversion`),
  ADD KEY `IX_ESPCHIPS_CHIPTYPE` (`chiptype`);

--
-- Indexes for table `firmwareversions`
--
ALTER TABLE `firmwareversions`
  ADD PRIMARY KEY (`id_firmwareversions`),
  ADD UNIQUE KEY `md5_UNIQUE` (`md5`),
  ADD KEY `IX_FIRMWAREVERSIONS_CHIPTYPE` (`chiptype`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chiptypes`
--
ALTER TABLE `chiptypes`
  MODIFY `id_chiptypes` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `espchips`
--
ALTER TABLE `espchips`
  MODIFY `id_espchips` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT for table `firmwareversions`
--
ALTER TABLE `firmwareversions`
  MODIFY `id_firmwareversions` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `espchips`
--
ALTER TABLE `espchips`
  ADD CONSTRAINT `FK_ESPCHIPS_CHIPTYPES` FOREIGN KEY (`chiptype`) REFERENCES `chiptypes` (`id_chiptypes`),
  ADD CONSTRAINT `fk_firmwareversionsallowedversion` FOREIGN KEY (`allowedversion`) REFERENCES `firmwareversions` (`md5`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_firmwareversionslastversion` FOREIGN KEY (`lastversion`) REFERENCES `firmwareversions` (`md5`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `firmwareversions`
--
ALTER TABLE `firmwareversions`
  ADD CONSTRAINT `FK_FIRMWAREVERSIONS_CHIPTYPE` FOREIGN KEY (`chiptype`) REFERENCES `chiptypes` (`id_chiptypes`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
