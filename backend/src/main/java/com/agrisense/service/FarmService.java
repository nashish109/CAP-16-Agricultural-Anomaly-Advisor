package com.agrisense.service;

import com.agrisense.dto.FarmDto;
import com.agrisense.entity.Farm;
import com.agrisense.entity.User;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.CropRepository;
import com.agrisense.repository.FarmRepository;
import com.agrisense.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<FarmDto> findAll() {
        User user = currentUserService.getCurrentUser();
        return farmRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FarmDto findById(Long id) {
        return toDto(getOwnedFarm(id));
    }

    @Transactional
    public FarmDto create(FarmDto dto) {
        User user = currentUserService.getCurrentUser();
        Farm farm = Farm.builder()
                .name(dto.getName())
                .location(dto.getLocation())
                .areaAcres(dto.getAreaAcres())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .description(dto.getDescription())
                .user(user)
                .build();
        return toDto(farmRepository.save(farm));
    }

    @Transactional
    public FarmDto update(Long id, FarmDto dto) {
        Farm farm = getOwnedFarm(id);
        farm.setName(dto.getName());
        farm.setLocation(dto.getLocation());
        farm.setAreaAcres(dto.getAreaAcres());
        farm.setLatitude(dto.getLatitude());
        farm.setLongitude(dto.getLongitude());
        farm.setDescription(dto.getDescription());
        return toDto(farmRepository.save(farm));
    }

    @Transactional
    public void delete(Long id) {
        Farm farm = getOwnedFarm(id);
        farmRepository.delete(farm);
    }

    public Farm getOwnedFarm(Long id) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", id));
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!farm.getUser().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Farm", id);
        }
        return farm;
    }

    private FarmDto toDto(Farm farm) {
        int fieldCount = fieldRepository.findByFarmId(farm.getId()).size();
        int cropCount = cropRepository.findByFieldFarmId(farm.getId()).size();
        return FarmDto.builder()
                .id(farm.getId())
                .name(farm.getName())
                .location(farm.getLocation())
                .areaAcres(farm.getAreaAcres())
                .latitude(farm.getLatitude())
                .longitude(farm.getLongitude())
                .description(farm.getDescription())
                .userId(farm.getUser().getId())
                .fieldCount(fieldCount)
                .cropCount(cropCount)
                .build();
    }
}
