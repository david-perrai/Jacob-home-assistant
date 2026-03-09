package com.davidperrai.jacob.core.googlemap.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.davidperrai.jacob.core.googlemap.entity.DirectoryEntry;

@Repository
public interface DirectoryEntryRepository extends JpaRepository<DirectoryEntry, Long> {

    @Query("SELECT d FROM DirectoryEntry d WHERE d.surname ilike :surname")
    List<DirectoryEntry> findBySurname(String surname);
}
