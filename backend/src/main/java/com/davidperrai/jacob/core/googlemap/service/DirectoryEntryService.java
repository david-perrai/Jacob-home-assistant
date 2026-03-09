package com.davidperrai.jacob.core.googlemap.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.davidperrai.jacob.core.googlemap.entity.DirectoryEntry;
import com.davidperrai.jacob.core.googlemap.repository.DirectoryEntryRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class DirectoryEntryService {
    private final DirectoryEntryRepository directoryEntryRepository;

    @Transactional(readOnly = true)
    public List<DirectoryEntry> findDirectoryEntryBySurname(String surname) {
        return directoryEntryRepository.findBySurname(surname);
    }
}
